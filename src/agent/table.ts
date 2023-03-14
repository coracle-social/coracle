import type {Writable} from 'svelte/store'
import LRUCache from 'lru-cache'
import {throttle} from 'throttle-debounce'
import {objOf, is, without} from 'ramda'
import {writable} from 'svelte/store'
import {isObject, mapValues, ensurePlural} from 'hurdak/lib/hurdak'
import {log} from 'src/util/logger'
import {where} from 'src/util/misc'
import {lf} from 'src/agent/database'

// Local copy of data so we can provide a sync observable interface. The worker
// is just for storing data and processing expensive queries

type CacheEntry = [string, {value: any}]

type TableOpts = {
  maxEntries?: number
  initialize?: (table: Table) => Promise<Array<CacheEntry>>
}

export const registry = {} as Record<string, Table>

export class Table {
  name: string
  pk: string
  opts: TableOpts
  cache: LRUCache<string, any>
  listeners: Array<(Table) => void>
  ready: Writable<boolean>
  constructor(name, pk, opts: TableOpts = {}) {
    this.name = name
    this.pk = pk
    this.opts = {maxEntries: 1000, initialize: t => this.dump(), ...opts}
    this.cache = new LRUCache({max: this.opts.maxEntries})
    this.listeners = []
    this.ready = writable(false)

    registry[name] = this

    // Sync from storage initially
    ;(async () => {
      const t = Date.now()

      this.cache.load(await this.opts.initialize(this) || [])
      this._notify()

      log(`Table ${name} ready in ${Date.now() - t}ms (${this.cache.size} records)`)

      this.ready.set(true)
    })()
  }
  _persist = throttle(4_000, () => {
    lf('setItem', this.name, this.cache.dump())
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
    cb = throttle(100, cb)

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
        throw new Error(`Missing primary key on ${this.name}`)
      }

      this.cache.set(k, item)
    }

    this._persist()
  }
  put(item) {
    this.bulkPut([item])
  }
  bulkPatch(items) {
    for (const item of items) {
      const k = item[this.pk]

      if (!k) {
        throw new Error(`Missing primary key on ${this.name}`)
      }

      this.cache.set(k, {...this.cache.get(k), ...item})
    }

    this._persist()
  }
  patch(item) {
    this.bulkPatch([item])
  }
  bulkRemove(ks) {
    for (const k of ks) {
      this.cache.delete(k)
    }

    this._persist()
  }
  remove(k) {
    this.bulkRemove([k])
  }
  async drop() {
    this.cache.clear()

    return lf('removeItem', this.name)
  }
  async dump() {
    let data = await lf('getItem', this.name) || []

    // Backwards compat - we used to store objects rather than cache dump arrays
    if (isObject(data)) {
      data = Object.entries(mapValues(objOf('value'), data))
    }

    return data as Array<CacheEntry>
  }
  toArray() {
    const result = []
    for (const item of this.cache.values()) {
      result.push(item)
    }

    return result
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

// Helper to allow us to listen to changes of any given table

const listener = (() => {
  let listeners = []

  for (const table of Object.values(registry) as Array<Table>) {
    table.subscribe(() => listeners.forEach(f => f(table.name)))
  }

  return {
    subscribe: f => {
      listeners.push(f)

      return () => {
        listeners = without([f], listeners)
      }
    },
  }
})()

// Helper to re-run a query every time a given table changes

export const watch = (names, f) => {
  names = ensurePlural(names)

  const store = writable(null)
  const tables = names.map(name => registry[name])

  // Initialize synchronously if possible
  const initialValue = f(...tables)
  if (is(Promise, initialValue)) {
    initialValue.then(v => store.set(v))
  } else {
    store.set(initialValue)
  }

  // Debounce refresh so we don't get UI lag
  const refresh = throttle(300, async () => store.set(await f(...tables)))

  // Listen for changes
  listener.subscribe(name => {
    if (names.includes(name)) {
      refresh()
    }
  })

  return store
}

// Methods that work on all tables

export const dropAll = async () => {
  for (const table of Object.values(registry)) {
    await table.drop()

    log(`Successfully dropped table ${table.name}`)
  }
}
