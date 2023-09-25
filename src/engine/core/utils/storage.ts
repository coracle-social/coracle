import {prop, identity, pluck, splitAt, nth, sortBy} from "ramda"
import {sleep, defer, chunk, randomInt, throttle} from "hurdak"
import {Storage as LocalStorage} from "hurdak"
import {sessions} from "src/engine/session/state"
import {people} from "src/engine/people/state"
import type {Writable, Collection} from "./store"
import {writable} from "./store"

type Store = {
  name: string
  opts: Record<string, any>
}

export class IndexedDB {
  db: any

  constructor(readonly dbName: string, readonly dbVersion: number, readonly stores: Store[]) {}

  open() {
    return new Promise<void>((resolve, reject) => {
      if (!window.indexedDB) {
        reject("Unsupported indexedDB")
      }

      const request = window.indexedDB.open(this.dbName, this.dbVersion)

      request.onsuccess = e => {
        this.db = request.result

        resolve()
      }

      // @ts-ignore
      request.onerror = e => reject(e.target.error)

      request.onupgradeneeded = e => {
        // @ts-ignore
        this.db = e.target.result

        this.stores.forEach(o => {
          try {
            this.db.createObjectStore(o.name, o.opts)
          } catch (e) {
            console.warn(e)
          }
        })
      }
    })
  }

  close() {
    return this.db.close()
  }

  delete() {
    window.indexedDB.deleteDatabase(this.dbName)
  }

  getAll(storeName): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const store = this.db.transaction(storeName).objectStore(storeName)
      const request = store.getAll()

      request.onerror = e => reject(e.target.error)
      request.onsuccess = e => resolve(e.target.result)
    })
  }

  async bulkPut(storeName, data) {
    const transaction = this.db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)

    return Promise.all(
      data.map(row => {
        return new Promise((resolve, reject) => {
          const request = store.put(row)

          request.onerror = e => reject(e.target.error)
          request.onsuccess = e => resolve(e.target.result)
        })
      })
    )
  }

  async bulkDelete(storeName, ids) {
    const transaction = this.db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)

    return Promise.all(
      ids.map(id => {
        return new Promise((resolve, reject) => {
          const request = store.delete(id)

          request.onerror = e => reject(e.target.error)
          request.onsuccess = e => resolve(e.target.result)
        })
      })
    )
  }

  clear(storeName) {
    return new Promise((resolve, reject) => {
      const request = this.db.transaction(storeName, "readwrite").objectStore(storeName).clear()

      request.onerror = e => reject(e.target.error)
      request.onsuccess = e => resolve(e.target.result)
    })
  }

  count(storeName) {
    return new Promise((resolve, reject) => {
      const request = this.db.transaction(storeName).objectStore(storeName).count()

      request.onerror = e => reject(e.target.error)
      request.onsuccess = e => resolve(e.target.result)
    })
  }
}

export type LocalStorageAdapterOpts = {
  load: (x: any) => any
  dump: (x: any) => any
}

export class LocalStorageAdapter {
  constructor(
    readonly key: string,
    readonly store: Writable<any>,
    readonly opts?: LocalStorageAdapterOpts
  ) {}

  initialize(storage: Storage) {
    const {key, store, opts} = this
    const {load, dump} = opts || {load: identity, dump: identity}

    if (Object.hasOwn(localStorage, key)) {
      store.set(load(LocalStorage.getJson(key)))
    }

    store.subscribe(throttle(300, $value => LocalStorage.setJson(key, dump($value))))
  }
}

export class IndexedDBAdapter {
  constructor(
    readonly key: string,
    readonly store: Collection<any>,
    readonly max: number,
    readonly sort?: (xs: any[]) => any[]
  ) {}

  getIndexedDBConfig() {
    return {
      name: this.key,
      opts: {
        keyPath: this.store.pk,
      },
    }
  }

  async initialize(storage: Storage) {
    const {key, store} = this

    store.set(await storage.db.getAll(key))

    store.subscribe(
      throttle(randomInt(3000, 5000), async <T>(rows: T) => {
        if (storage.dead.get()) {
          return
        }

        // Do it in small steps to avoid clogging stuff up
        for (const records of chunk(100, (rows as any[]).filter(prop(store.pk)))) {
          await storage.db.bulkPut(key, records)
          await sleep(50)

          if (storage.dead.get()) {
            return
          }
        }
      })
    )
  }

  prune(storage) {
    const {store, key, max, sort} = this
    const data = store.get()

    if (data.length < max * 1.1 || storage.dead.get()) {
      return
    }

    const [discard, keep] = splitAt(max, sort ? sort(data) : data)

    store.set(keep)

    storage.db.bulkDelete(key, pluck(store.pk, discard))
  }
}

export class Storage {
  db: IndexedDB
  ready = defer()
  dead = writable(false)

  constructor(readonly adapters: (LocalStorageAdapter | IndexedDBAdapter)[]) {
    this.initialize()
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

  async initialize() {
    const indexedDBAdapters = this.adapters.filter(
      a => a instanceof IndexedDBAdapter
    ) as IndexedDBAdapter[]

    if (window.indexedDB) {
      const dbConfig = indexedDBAdapters.map(adapter => adapter.getIndexedDBConfig())

      this.db = new IndexedDB("nostr-engine/Storage", 4, dbConfig)

      window.addEventListener("beforeunload", () => this.close())

      await this.db.open()
    }

    await Promise.all(this.adapters.map(adapter => adapter.initialize(this)))

    // Every so often randomly prune a store
    setInterval(() => {
      const adapter = indexedDBAdapters[Math.floor(indexedDBAdapters.length * Math.random())]

      adapter.prune(this)
    }, 30_000)

    this.ready.resolve()
  }
}

export const sortByPubkeyWhitelist =
  (fallback: (x: any) => number) => (rows: Record<string, any>[]) => {
    const pubkeys = new Set(Object.values(sessions.get()).map(prop("pubkey")))
    const follows = new Set(
      Array.from(pubkeys)
        .flatMap((pk: string) => people.key(pk).get().petnames || [])
        .map(nth(1))
    )

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
