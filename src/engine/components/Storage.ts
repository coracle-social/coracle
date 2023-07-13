import Loki from "lokijs"
import {throttle} from "throttle-debounce"
import {identity, prop, path as getPath, sortBy, partition} from "ramda"
import IncrementalIndexedDBAdapter from "lokijs/src/incremental-indexeddb-adapter"
import {createMap} from "hurdak/lib/hurdak"
import {defer, sleep, union, getLocalJson, setLocalJson} from "src/util/misc"
import {writable} from "../util/store"

type CollectionPolicy = {
  maxRecords?: number
  sortEntries?: (rows: any[]) => any[]
}

// Utils

const getStorageKey = key => "engine/" + key.replace(/\./g, "/")

const saveDatabase = throttle(3000, () => loki.saveDatabase(e => e && console.error(e)))

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
    const store = getPath(key.split("."), engine)

    collections[key] = loki.addCollection(getStorageKey(key), {unique: [store.pk]})
  }

  const e = await new Promise(resolve => loki.loadDatabase({}, resolve))

  if (e) {
    console.error(e)
  }

  for (const key of Object.keys(policies)) {
    const store = getPath(key.split("."), engine)
    const coll = loki.getCollection(getStorageKey(key)) || collections[key]

    store.set(coll.find())

    // Wait a bit before re-saving, it appears to take some time to load existing data
    sleep(1000).then(() => {
      store.subscribe(
        throttle(3000, async rows => {
          if (dead.get()) {
            return
          }

          const [updates, creates] = partition(row => coll.by(store.pk, row[store.pk]), rows)

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
    const store = getPath(key.split("."), engine)
    const data = store.get()

    if (data.length < maxRecords * 1.1) {
      return
    }

    store.set(sortEntries(data).slice(-maxRecords))
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

    const sortByPubkeyWhitelist = fallback => rows => {
      const whitelist = getPubkeyWhitelist()

      return sortBy(x => (whitelist.has(x.pubkey) ? Infinity : fallback(x)), rows)
    }

    syncCollections(engine, {
      "Alerts.events": {
        maxRecords: 500,
        sortEntries: sortBy(prop("created_at")),
      },
      "Nip28.channels": {
        maxRecords: 1000,
        sortEntries: sortBy(e => (e.joined ? 0 : -Math.max(e.last_checked || 0, e.last_sent || 0))),
      },
      "Nip28.messages": {
        maxRecords: 10000,
        sortEntries: sortBy(prop("created_at")),
      },
      "Nip04.contacts": {
        maxRecords: 1000,
        sortEntries: sortBy(e => -Math.max(e.last_checked || 0, e.last_sent || 0)),
      },
      "Nip04.messages": {
        maxRecords: 10000,
        sortEntries: sortBy(prop("created_at")),
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
