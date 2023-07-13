import Loki from "lokijs"
import {throttle} from "throttle-debounce"
import {identity, prop, path as getPath, sortBy, partition} from "ramda"
import IncrementalIndexedDBAdapter from "lokijs/src/incremental-indexeddb-adapter"
import {createMap} from "hurdak/lib/hurdak"
import {defer, sleep, union, getLocalJson, setLocalJson} from "src/util/misc"
import {writable} from "../util/store"

type Entry = {
  key: string
  record: Record<string, any>
}

type CollectionPolicy = {
  maxRecords?: number
  sortEntries?: (records: Entry[]) => Entry[]
}

// Utils

const fromMap = m => Array.from(m.entries()).map(([key, record]) => ({key, record}))

const toMap = data => new Map(data.map(x => [x.key, x.record]))

const getStorageKey = key => "engine/" + key.replace(/\./g, "/")

const saveDatabase = throttle(3000, () => loki.saveDatabase(e => e && console.error(e)))

const sortEntriesBy = f => sortBy(({key, record}) => f(record))

// Loki

const Adapter = window.indexedDB ? IncrementalIndexedDBAdapter : Loki.LokiMemoryAdapter

const loki = new Loki("engine/Storage/db", {
  adapter: new Adapter(),
})

const ready = defer()

const dead = writable(false)

const close = () => {
  dead.set(true)

  return new Promise(resolve => loki.close(resolve))
}

const clear = () => {
  dead.set(true)

  localStorage.clear()

  return new Promise(resolve => loki.deleteDatabase(resolve))
}

window.addEventListener("beforeunload", () => loki.close())

// Sync helpers

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

const syncCollections = async (engine, policies: Record<string, CollectionPolicy>) => {
  // loki.getCollection doesn't always work for some reason. Try to get, then fall back
  // since addCollection returns empty collections, so at least something will work
  const collections = {}

  for (const key of Object.keys(policies)) {
    collections[key] = loki.addCollection(getStorageKey(key), {unique: ["key"]})
  }

  const e = await new Promise(resolve => loki.loadDatabase({}, resolve))

  if (e) {
    console.error(e)
  }

  for (const key of Object.keys(policies)) {
    const base = getPath(key.split("."), engine).getBaseStore()
    const coll = loki.getCollection(getStorageKey(key)) || collections[key]

    base.set(toMap(coll.find()))

    // Wait a bit before re-saving, it appears to take some time to load existing data
    sleep(1000).then(() => {
      base.subscribe(
        throttle(3000, async records => {
          if (dead.get()) {
            return
          }

          const [updates, creates] = partition(({key}) => coll.by("key", key), fromMap(records))

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
    const {maxRecords = 5000, sortEntries = identity} = policy
    const store = getPath(key.split("."), engine).getBaseStore()
    const data = store.get()

    if (data.size < maxRecords * 1.1) {
      return
    }

    store.set(toMap(sortEntries(fromMap(data)).slice(-maxRecords)))
  }, 30_000)
}

export class Storage {
  static contributeState() {
    return {ready, dead}
  }

  static contributeActions({Storage}) {
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

      return sortEntriesBy(x => (whitelist.has(x.pubkey) ? Infinity : fallback(x)))
    }

    syncCollections(engine, {
      "Alerts.events": {
        maxRecords: 500,
        sortEntries: sortEntriesBy(prop("created_at")),
      },
      "Nip28.channels": {
        maxRecords: 1000,
        sortEntries: sortEntriesBy(e =>
          e.joined ? 0 : -Math.max(e.last_checked || 0, e.last_sent || 0)
        ),
      },
      "Nip28.messages": {
        maxRecords: 10000,
        sortEntries: sortEntriesBy(prop("created_at")),
      },
      "Nip04.contacts": {
        maxRecords: 1000,
        sortEntries: sortEntriesBy(e => -Math.max(e.last_checked || 0, e.last_sent || 0)),
      },
      "Nip04.messages": {
        maxRecords: 10000,
        sortEntries: sortEntriesBy(prop("created_at")),
      },
      "Content.topics": {},
      "Content.lists": {
        maxRecords: 500,
        sortEntries: sortByPubkeyWhitelist(prop("updated_at")),
      },
      "Directory.profiles": {
        sortEntries: sortByPubkeyWhitelist(prop("updated_at")),
      },
      "Events.cache": {
        sortEntries: sortByPubkeyWhitelist(prop("created_at")),
      },
      "Nip02.graph": {
        sortEntries: sortByPubkeyWhitelist(prop("updated_at")),
      },
      "Nip05.handles": {
        sortEntries: sortByPubkeyWhitelist(prop("updated_at")),
      },
      "Nip57.zappers": {
        sortEntries: sortByPubkeyWhitelist(prop("updated_at")),
      },
      "Nip65.relays": {
        maxRecords: 2000,
        sortEntries: prop("count"),
      },
      "Nip65.policies": {
        sortEntries: sortByPubkeyWhitelist(prop("updated_at")),
      },
    })
  }
}
