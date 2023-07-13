import Loki from "lokijs"
import {throttle} from "throttle-debounce"
import {identity, prop, path as getPath, sortBy, partition} from "ramda"
import IncrementalIndexedDBAdapter from "lokijs/src/incremental-indexeddb-adapter"
import {createMapOf, createMap} from "hurdak/lib/hurdak"
import {defer, union, getLocalJson, setLocalJson} from "src/util/misc"
import {writable} from "../util/store"

const Adapter = window.indexedDB ? IncrementalIndexedDBAdapter : Loki.LokiMemoryAdapter

const ready = defer()

const dead = writable(false)

const loki = new Loki("agent.db", {
  autoload: true,
  autosave: true,
  autosaveInterval: 4000,
  throttledSaves: true,
  adapter: new Adapter(),
  autoloadCallback: () => ready.resolve(),
})

window.addEventListener("beforeunload", () => loki.close())

const syncScalars = (engine, keys) => {
  for (const key of keys) {
    const store = getPath(key.split("."), engine)
    const storageKey = key.replace(/./g, "/")

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

const syncCollections = (engine, policies: Record<string, CollectionPolicy>) => {
  for (const key of Object.keys(policies)) {
    const store = getPath(key.split("."), engine)
    const storageKey = key.replace(/./g, "/")
    const coll = loki.addCollection(storageKey, {unique: ["key"]})

    ready.then(() => {
      store.getBaseStore().set(new Map(Object.entries(createMapOf("key", "record", coll.find()))))
    })

    store.subscribe(
      throttle(1000, async records => {
        if (dead) {
          return
        }

        await ready

        const [updates, creates] = partition(
          ({key}) => coll.by("key", key),
          records.map(([key, record]) => ({key, record}))
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
      })
    )
  }

  // Every so often randomly prune a store
  setInterval(() => {
    const policyEntries = Object.entries(policies)
    const [key, policy] = policyEntries[Math.floor(policyEntries.length * Math.random())]
    const {maxRecords = 5000, sortRecords = identity} = policy
    const store = getPath(key.split("."), engine)
    const data = store.get()

    if (data.size < maxRecords * 1.1) {
      return
    }

    store.set(sortRecords(Array.from(data.values())).slice(-maxRecords))
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
      "User.settings",
    ])

    const getPubkeyWhitelist = () => {
      const pubkeys = engine.Keys.state.get().map(prop("pubkey"))

      return union(new Set(pubkeys), engine.Social.getFollowsSet(pubkeys))
    }

    const sortByPubkeyWhitelist = fallback => records => {
      const whitelist = getPubkeyWhitelist()

      return sortBy(x => (whitelist.has(x.pubkey) ? Infinity : fallback(x)))
    }

    syncCollections(engine, {
      "Keys.state": {
        maxRecords: 50,
      },
      "Alerts.events": {
        maxRecords: 500,
        sortRecords: sortBy(prop("created_at")),
      },
      "Chat.channels": {
        maxRecords: 50,
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
