import {throttle} from "throttle-debounce"
import {prop, path as getPath, sortBy} from "ramda"
import {defer, getLocalJson, setLocalJson} from "src/util/misc"
import {writable} from "../util/store"
import {IndexedDB} from "../util/indexeddb"

const localStorageKeys = ["Alerts.lastChecked", "Keys.pubkey", "Keys.keyState", "User.settings"]

const policy = (key, max, sort) => ({key, max, sort})

const sortChannels = sortBy(e => (e.joined ? 0 : -Math.max(e.last_checked || 0, e.last_sent || 0)))

const sortContacts = sortBy(e => -Math.max(e.last_checked || 0, e.last_sent || 0))

const getCollectionPolicies = ({Storage}) => [
  policy("Alerts.events", 500, sortBy(prop("created_at"))),
  policy("Nip28.channels", 1000, sortChannels),
  policy("Nip28.messages", 10000, sortBy(prop("created_at"))),
  policy("Nip04.contacts", 1000, sortContacts),
  policy("Nip04.messages", 10000, sortBy(prop("created_at"))),
  policy("Content.topics", 1000, sortBy(prop("count"))),
  policy("Content.lists", 500, Storage.sortByPubkeyWhitelist(prop("updated_at"))),
  policy("Directory.profiles", 5000, Storage.sortByPubkeyWhitelist(prop("updated_at"))),
  policy("Events.cache", 5000, Storage.sortByPubkeyWhitelist(prop("created_at"))),
  policy("Nip02.graph", 5000, Storage.sortByPubkeyWhitelist(prop("updated_at"))),
  policy("Nip05.handles", 5000, Storage.sortByPubkeyWhitelist(prop("updated_at"))),
  policy("Nip57.zappers", 5000, Storage.sortByPubkeyWhitelist(prop("updated_at"))),
  policy("Nip65.relays", 2000, prop("count")),
  policy("Nip65.policies", 5000, Storage.sortByPubkeyWhitelist(prop("updated_at"))),
]

// Sync helpers

const syncScalars = (engine, keys) => {
  for (const key of keys) {
    const store = getPath(key.split("."), engine)

    if (Object.hasOwn(localStorage, key)) {
      store.set(getLocalJson(key))
    }

    store.subscribe(throttle(300, $value => setLocalJson(key, $value)))
  }
}

const syncCollections = async (engine, policies) => {
  for (const {key} of policies) {
    const store = getPath(key.split("."), engine)

    store.set(await engine.Storage.db.getAll(key))

    store.subscribe(
      throttle(3000, async rows => {
        if (engine.Storage.dead.get()) {
          return
        }

        await engine.Storage.db.clear(key)
        await engine.Storage.db.bulkAdd(key, rows)
      })
    )
  }

  // Every so often randomly prune a store
  setInterval(() => {
    const {key, max, sort} = policies[Math.floor(policies.length * Math.random())]
    const store = getPath(key.split("."), engine)
    const data = store.get()

    if (data.length < max * 1.1) {
      return
    }

    store.set(sort(data).slice(-max))
  }, 30_000)
}

export class Storage {
  static contributeState() {
    const ready = defer()

    const dead = writable(false)

    return {db: null, ready, dead}
  }

  static contributeActions({Storage, Social, Keys}) {
    const close = () => {
      Storage.dead.set(true)

      return Storage.db?.close()
    }

    const clear = () => {
      Storage.dead.set(true)

      localStorage.clear()

      return Storage.db?.delete()
    }

    const getPubkeyWhitelist = () => {
      const pubkeys = Keys.getKeyState().map(prop("pubkey"))

      return [new Set(pubkeys), Social.getFollowsSet(pubkeys)]
    }

    const sortByPubkeyWhitelist = fallback => rows => {
      const [pubkeys, follows] = getPubkeyWhitelist()

      return sortBy(x => {
        if (pubkeys.has(x.pubkey)) {
          return Number.MAX_SAFE_INTEGER
        }

        if (follows.has(x.pubkey)) {
          return Number.MAX_SAFE_INTEGER - 1
        }

        return fallback(x)
      }, rows)
    }

    return {close, clear, getPubkeyWhitelist, sortByPubkeyWhitelist}
  }

  static async initialize(engine) {
    syncScalars(engine, localStorageKeys)

    if (window.indexedDB) {
      const policies = getCollectionPolicies(engine)

      const indexedDBStores = policies.map(({key}) => {
        const store = getPath(key.split("."), engine)

        return {
          name: key,
          opts: {
            keyPath: store.pk,
          },
        }
      })

      engine.Storage.db = new IndexedDB("nostr-engine/Storage", 1, indexedDBStores)

      window.addEventListener("beforeunload", () => engine.Storage.close())

      await engine.Storage.db.open()

      await syncCollections(engine, policies)
    }

    engine.Storage.ready.resolve()
  }
}
