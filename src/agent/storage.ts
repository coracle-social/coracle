import type {Writable} from "svelte/store"
import {throttle} from "throttle-debounce"
import {objOf, is, without} from "ramda"
import {writable} from "svelte/store"
import {isObject, mapValues, ensurePlural} from "hurdak/lib/hurdak"
import Cache from "src/util/cache"
import {log, error} from "src/util/logger"
import {where} from "src/util/misc"

// ----------------------------------------------------------------------------
// Localforage interface via web worker

type Message = {
  topic: string
  payload: object
}

const worker = new Worker(new URL("./workers/database.js", import.meta.url), {type: "module"})

worker.addEventListener("error", error)

class Channel {
  id: string
  onMessage: (e: MessageEvent) => void
  constructor({onMessage}) {
    this.id = Math.random().toString().slice(2)
    this.onMessage = e => {
      if (e.data.channel === this.id) {
        onMessage(e.data as Message)
      }
    }

    worker.addEventListener("message", this.onMessage)
  }
  close() {
    worker.removeEventListener("message", this.onMessage)
  }
  send(topic, payload) {
    worker.postMessage({channel: this.id, topic, payload})
  }
}

const call = (topic, payload): Promise<Message> => {
  return new Promise(resolve => {
    const channel = new Channel({
      onMessage: message => {
        resolve(message)
        channel.close()
      },
    })

    channel.send(topic, payload)
  })
}

const lf = async (method, ...args) => {
  const message = await call("localforage.call", {method, args})

  if (message.topic !== "localforage.return") {
    throw new Error(`callLocalforage received invalid response: ${message}`)
  }

  return message.payload
}

export const setItem = (k, v) => lf("setItem", k, v)
export const removeItem = k => lf("removeItem", k)
export const getItem = k => lf("getItem", k)

// ----------------------------------------------------------------------------
// Database table abstraction, synced to worker storage

type CacheEntry = [string, {value: any; lru: number}]

type TableOpts = {
  cache?: Cache
  initialize?: (table: Table) => Promise<Array<CacheEntry>>
}

export const registry = {} as Record<string, Table>

export class Table {
  name: string
  pk: string
  opts: TableOpts
  cache: Cache
  listeners: Array<(Table) => void>
  ready: Writable<boolean>
  interval: number
  constructor(name, pk, opts: TableOpts = {}) {
    this.name = name
    this.pk = pk
    this.opts = opts
    this.cache = this.opts.cache || new Cache()
    this.listeners = []
    this.ready = writable(false)

    registry[name] = this

    // Sync from storage initially
    ;(async () => {
      const t = Date.now()

      let data = (await getItem(this.name)) || []

      // Backwards compat - we used to store objects rather than cache dump arrays
      if (isObject(data)) {
        data = Object.entries(mapValues(objOf("value"), data))
      }

      // Initialize our cache and notify listeners
      this.cache.load(data)
      this._notify()

      log(`Table ${name} ready in ${Date.now() - t}ms (${this.cache.size()} records)`)

      this.ready.set(true)
    })()

    // Prune the cache periodically, with jitter to avoid doing all caches at once
    this.interval = window.setInterval(() => {
      this.cache.prune()
      this._persist()
    }, 30_000 + 10_000 * Math.random())
  }
  _persist = throttle(4_000, () => {
    setItem(this.name, this.cache.dump())
  })
  _notify() {
    // Notify subscribers
    for (const cb of this.listeners) {
      cb(this)
    }

    // Save to localstorage
    this._persist()
  }
  subscribe(cb) {
    this.listeners.push(cb)

    cb(this)

    return () => {
      this.listeners = without([cb], this.listeners)
    }
  }
  bulkPut(items) {
    for (const item of items) {
      const k = item[this.pk]

      if (!k) {
        throw new Error(`Missing gray-6 key on ${this.name}`)
      }

      this.cache.set(k, item)
    }

    this._notify()
  }
  put(item) {
    this.bulkPut([item])
  }
  bulkPatch(items) {
    for (const item of items) {
      const k = item[this.pk]

      if (!k) {
        throw new Error(`Missing gray-6 key on ${this.name}`)
      }

      this.cache.set(k, {...this.cache.get(k), ...item})
    }

    this._notify()
  }
  patch(item) {
    this.bulkPatch([item])
  }
  bulkRemove(ks) {
    for (const k of ks) {
      this.cache.delete(k)
    }

    this._notify()
  }
  remove(k) {
    this.bulkRemove([k])
  }
  async drop() {
    this.cache.clear()

    await removeItem(this.name)
  }
  toArray() {
    return Array.from(this.cache.values())
  }
  all(spec = {}) {
    return this.toArray().filter(where(spec))
  }
  find(spec = {}) {
    return this.cache.find(where(spec))
  }
  get(k) {
    return this.cache.get(k)
  }
}

export const listener = (() => {
  let listeners = []

  return {
    connect: () => {
      for (const table of Object.values(registry) as Array<Table>) {
        table.subscribe(() => listeners.forEach(f => f(table.name)))
      }
    },
    subscribe: f => {
      listeners.push(f)

      return () => {
        listeners = without([f], listeners)
      }
    },
  }
})()

type WatchStore<T> = Writable<T> & {
  refresh: () => void
}

export const watch = (names, f) => {
  names = ensurePlural(names)

  const store = writable(null) as WatchStore<any>
  const tables = names.map(name => registry[name])

  // Initialize synchronously if possible
  const initialValue = f(...tables)
  if (is(Promise, initialValue)) {
    initialValue.then(v => store.set(v))
  } else {
    store.set(initialValue)
  }

  // Debounce refresh so we don't get UI lag
  store.refresh = throttle(300, async () => store.set(await f(...tables)))

  // Listen for changes
  listener.subscribe(name => {
    if (names.includes(name)) {
      store.refresh()
    }
  })

  return store
}

export const dropAll = async () => {
  for (const table of Object.values(registry)) {
    await table.drop()

    log(`Successfully dropped table ${table.name}`)
  }
}
