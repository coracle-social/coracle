import Loki from "lokijs"
import {throttle} from "throttle-debounce"
import {identity, prop, path as getPath, sortBy, partition} from "ramda"
import IncrementalIndexedDBAdapter from "lokijs/src/incremental-indexeddb-adapter"
import {createMapOf, createMap} from "hurdak/lib/hurdak"
import {defer, sleep, union, getLocalJson, setLocalJson} from "src/util/misc"
import {writable} from "../util/store"

const Adapter = window.indexedDB ? IncrementalIndexedDBAdapter : Loki.LokiMemoryAdapter

const ready = defer()

const dead = writable(false)

const loki = new Loki("engine/Storage/db", {
  adapter: new Adapter(),
  autoloadCallback: ready.resolve,
})

window.addEventListener("beforeunload", () => loki.close())

const getStorageKey = key => "engine/" + key.replace(/\./g, "/")

const saveDatabase = throttle(3000, () => loki.saveDatabase(e => e && console.error(e)))

const syncScalars = (engine, keys) => {
  for (const key of keys) {
    const store = getPath(key.split("."), engine)
    const storageKey = getStorageKey(key)

    if (Object.hasOwn(localStorage, storageKey)) {
      store.set(getLocalJson(storageKey))
    }

    store.subscribe(throttle(300, $value => setLocalJson(storageKey, $value)))
  }
}

type CollectionPolicy = {
  maxRecords?: number
  sortRecords?: (records: any[]) => any[]
}

const syncCollections = async (engine, policies: Record<string, CollectionPolicy>) => {
  for (const key of Object.keys(policies)) {
    loki.addCollection(getStorageKey(key), {unique: ["key"]})
  }

  const e = await new Promise(resolve => loki.loadDatabase({}, resolve))

  if (e) {
    console.error(e)
  }

  for (const key of Object.keys(policies)) {
    const base = getPath(key.split("."), engine).getBaseStore()
    const coll = loki.getCollection(getStorageKey(key))

    base.set(new Map(Object.entries(createMapOf("key", "record", coll.find()))))

    // Wait a bit before re-saving, it appears to take some time to load existing data
    sleep(5000).then(() => {
      base.subscribe(
        throttle(3000, async records => {
          if (dead.get()) {
            return
          }

          const [updates, creates] = partition(
            ({key}) => coll.by("key", key),
            Array.from(records.entries()).map(([key, record]) => ({key, record}))
          )

          if (creates.length > 0) {
            // Something internal to loki is broken
            coll.changes = coll.changes || []
            coll.insert(creates)
          }

          if (updates.length > 0) {
            const updatesByPk = createMap("key", updates)

            coll.updateWhere(
              record => Boolean(updatesByPk[record.key]),
              existingRecord => {
                const {key, record} = updatesByPk[existingRecord.key]

                return {
                  key,
                  record: {
                    ...existingRecord,
                    ...record,
                  },
                }
              }
            )
          }

          saveDatabase()
        })
      )
    })

    ready.resolve()
  }

  // Every so often randomly prune a store
  setInterval(() => {
    const policyEntries = Object.entries(policies)
    const [key, policy] = policyEntries[Math.floor(policyEntries.length * Math.random())]
    const {maxRecords = 5000, sortRecords = identity} = policy
    const store = getPath(key.split("."), engine)
    const data = store.get()

    if (data.length < maxRecords * 1.1) {
      return
    }

    store.getBaseStore().set(sortRecords(data).slice(-maxRecords))
  }, 30_000)
}

export class Storage {
  static contributeState() {
    return {ready, dead}
  }

  static contributeActions({Storage}) {
    const close = () => {
      dead.set(true)

      return new Promise(resolve => loki.close(resolve))
    }

    const clear = () => {
      dead.set(true)

      localStorage.clear()

      return new Promise(resolve => loki.deleteDatabase(resolve))
    }

    return {close, clear}
  }

  static initialize(engine) {
    syncScalars(engine, [
      "Alerts.lastChecked",
      "Alerts.latestNotification",
      "Keys.pubkey",
      "Keys.keyState",
      "User.settings",
    ])

    const getPubkeyWhitelist = () => {
      const pubkeys = engine.getKeyState().map(prop("pubkey"))

      return union(new Set(pubkeys), engine.Social.getFollowsSet(pubkeys))
    }

    const sortByPubkeyWhitelist = fallback => records => {
      const whitelist = getPubkeyWhitelist()

      return sortBy(x => (whitelist.has(x.pubkey) ? Infinity : fallback(x)))
    }

    syncCollections(engine, {
      "Alerts.events": {
        maxRecords: 500,
        sortRecords: sortBy(prop("created_at")),
      },
      "Chat.channels": {
        maxRecords: 1000,
        sortRecords: sortBy(e => -Math.max(e.last_checked || 0, e.last_sent || 0)),
      },
      "Chat.messages": {
        maxRecords: 10000,
        sortRecords: sortBy(prop("created_at")),
      },
      "Content.topics": {},
      "Content.lists": {
        maxRecords: 500,
        sortRecords: sortByPubkeyWhitelist(prop("updated_at")),
      },
      "Directory.profiles": {
        sortRecords: sortByPubkeyWhitelist(prop("updated_at")),
      },
      "Events.cache": {
        sortRecords: sortByPubkeyWhitelist(prop("created_at")),
      },
      "Nip05.handles": {
        sortRecords: sortByPubkeyWhitelist(prop("updated_at")),
      },
      "Nip57.zappers": {
        sortRecords: sortByPubkeyWhitelist(prop("updated_at")),
      },
      "Routing.relays": {
        maxRecords: 2000,
        sortRecords: prop("count"),
      },
      "Routing.policies": {
        sortRecords: sortByPubkeyWhitelist(prop("updated_at")),
      },
      "Social.graph": {
        sortRecords: sortByPubkeyWhitelist(prop("updated_at")),
      },
    })
  }
}
