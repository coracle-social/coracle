import {prop, pluck, splitAt, path as getPath, sortBy} from "ramda"
import {sleep, defer, chunk, randomInt, throttle} from "hurdak"
import {Storage as LocalStorage} from "hurdak"
import type {Channel, Contact} from "src/engine/types"
import type {Engine} from "src/engine/Engine"
import {writable} from "src/engine/util/store"
import type {Collection} from "src/engine/util/store"
import {IndexedDB} from "src/engine/util/indexeddb"

const localStorageKeys = ["Keys.pubkey", "Keys.keyState", "Settings.settings"]

const sortChannels = sortBy((e: Channel) =>
  e.joined ? 0 : -Math.max(e.last_checked || 0, e.last_sent || 0)
)

const sortContacts = sortBy((e: Contact) => -Math.max(e.last_checked || 0, e.last_sent || 0))

const policy = (key: string, max: number, sort: (xs: any[]) => any[]) => ({key, max, sort})

const getStore = (key: string, engine: Engine) => getPath(key.split("."), engine) as Collection<any>

export class StorageAdapter {
  engine: Engine
  db: IndexedDB
  ready = defer()
  dead = writable(false)

  constructor(engine: Engine) {
    this.engine = engine

    Promise.all([this.syncToLocalStorage(), this.syncToIndexedDb()]).then(() => {
      this.ready.resolve()
    })
  }

  close = () => {
    this.dead.set(true)

    return this.db?.close()
  }

  clear = () => {
    this.dead.set(true)

    localStorage.clear()

    return this.db?.delete()
  }

  getPubkeyWhitelist = () => {
    const pubkeys = this.engine.Keys.keyState.get().map(prop("pubkey"))

    return [new Set(pubkeys), this.engine.Nip02.getFollowsSet(pubkeys)]
  }

  sortByPubkeyWhitelist = (fallback: (x: any) => number) => (rows: Record<string, any>[]) => {
    const [pubkeys, follows] = this.getPubkeyWhitelist()

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

  syncToLocalStorage() {
    for (const key of localStorageKeys) {
      const store = getStore(key, this.engine)

      if (Object.hasOwn(localStorage, key)) {
        store.set(LocalStorage.getJson(key))
      }

      store.subscribe(throttle(300, $value => LocalStorage.setJson(key, $value)))
    }
  }

  async syncToIndexedDb() {
    if (window.indexedDB) {
      const policies = [
        policy("Nip28.channels", 2000, sortChannels),
        policy("Nip28.messages", 10000, sortBy(prop("created_at"))),
        policy("Nip04.contacts", 1000, sortContacts),
        policy("Nip04.messages", 10000, sortBy(prop("created_at"))),
        policy("Nip24.channels", 1000, sortChannels),
        policy("Nip24.messages", 10000, sortBy(prop("created_at"))),
        policy("Content.topics", 1000, sortBy(prop("count"))),
        policy("Content.lists", 500, this.sortByPubkeyWhitelist(prop("updated_at"))),
        policy("Content.labels", 10000, this.sortByPubkeyWhitelist(prop("updated_at"))),
        policy("Directory.profiles", 5000, this.sortByPubkeyWhitelist(prop("updated_at"))),
        policy("Events.cache", 5000, this.sortByPubkeyWhitelist(prop("created_at"))),
        policy("Nip02.graph", 5000, this.sortByPubkeyWhitelist(prop("updated_at"))),
        policy("Nip05.handles", 5000, this.sortByPubkeyWhitelist(prop("updated_at"))),
        policy("Nip57.zappers", 5000, this.sortByPubkeyWhitelist(prop("updated_at"))),
        policy("Nip65.relays", 2000, prop("count")),
        policy("Nip65.policies", 5000, this.sortByPubkeyWhitelist(prop("updated_at"))),
      ]

      this.db = new IndexedDB(
        "nostr-engine/Storage",
        3,
        policies.map(({key}) => {
          const store = getStore(key, this.engine)

          return {
            name: key,
            opts: {
              keyPath: store.pk,
            },
          }
        })
      )

      window.addEventListener("beforeunload", () => this.close())

      await this.db.open()

      for (const {key} of policies) {
        const store = getStore(key, this.engine)

        store.set(await this.db.getAll(key))

        store.subscribe(
          throttle(randomInt(3000, 5000), async <T>(rows: T) => {
            if (this.dead.get()) {
              return
            }

            // Do it in small steps to avoid clogging stuff up
            for (const records of chunk(100, rows as any[])) {
              await this.db.bulkPut(key, records)
              await sleep(50)

              if (this.dead.get()) {
                return
              }
            }
          })
        )
      }

      // Every so often randomly prune a store
      setInterval(() => {
        const {key, max, sort} = policies[Math.floor(policies.length * Math.random())]
        const store = getStore(key, this.engine)
        const data = store.get()

        if (data.length < max * 1.1 || this.dead.get()) {
          return
        }

        const [discard, keep] = splitAt(max, sort(data))

        store.set(keep)
        this.db.bulkDelete(key, pluck(store.pk, discard))
      }, 30_000)
    }
  }
}
