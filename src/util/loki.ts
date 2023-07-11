import type {Writable} from "svelte/store"
import Loki from "lokijs"
import IncrementalIndexedDBAdapter from "lokijs/src/incremental-indexeddb-adapter"
import {partition, uniqBy, prop, always, pluck, without, is} from "ramda"
import {throttle} from "throttle-debounce"
import {writable} from "svelte/store"
import {ensurePlural, noop, createMap} from "hurdak/lib/hurdak"

const Adapter = window.indexedDB ? IncrementalIndexedDBAdapter : Loki.LokiMemoryAdapter

export const loki = new Loki("agent.db", {
  autoload: true,
  autosave: true,
  autosaveInterval: 4000,
  throttledSaves: true,
  adapter: new Adapter(),
  autoloadCallback: () => {
    listener.connect()

    for (const table of Object.values(registry)) {
      table.initialize()
    }

    setTimeout(() => ready.set(true), 100)
  },
})

window.addEventListener("beforeunload", () => loki.close())

const stubCollection = {
  insert: noop,
  updateWhere: noop,
  removeWhere: noop,
  findAndRemove: noop,
  clear: noop,
  find: always([]),
  findOne: always(null),
  by: always(null),
  count: always(0),
  chain: () => stubCollection,
}

// ----------------------------------------------------------------------------
// Database table abstraction around loki

const registry = {} as Record<string, Table<any>>

export class Table<T> {
  name: string
  pk: string
  _max: number
  _sort: (xs: Array<T>) => Array<T>
  _coll?: Loki
  _subs: Array<() => void>
  constructor(name, pk, {max = 500, sort = null} = {}) {
    this.name = name
    this.pk = pk
    this._max = max
    this._sort = sort
    this._coll = stubCollection
    this._subs = []

    registry[name] = this
  }
  initialize() {
    this._coll = loki.addCollection(this.name, {unique: [this.pk]})
    this._coll.addListener(["insert", "update"], this.notify)

    this.notify()
  }
  notify = () => {
    for (const cb of this._subs) {
      cb()
    }
  }
  subscribe(cb) {
    this._subs.push(cb)

    return () => {
      this._subs = without([cb], this._subs)
    }
  }
  patch(items: Record<string, any> | Record<string, any>[]) {
    if (loki.dead) {
      return
    }

    const [updates, creates] = partition(
      item => this.get(item[this.pk]),
      uniqBy(prop(this.pk), ensurePlural(items))
    )

    if (creates.length > 0) {
      // Something internal to loki is broken
      this._coll.changes = this._coll.changes || []
      this._coll.insert(creates)
    }

    if (updates.length > 0) {
      const updatesByPk = createMap(this.pk, updates)

      this._coll.updateWhere(
        item => Boolean(updatesByPk[item[this.pk]]),
        item => ({...item, ...updatesByPk[item[this.pk]]})
      )
    }
  }
  remove(ks) {
    this._coll.removeWhere({[this.pk]: {$in: ks}})
  }
  prune() {
    if (this._coll.count() < this._max * 1.1) {
      return
    }

    let data = this.all()

    if (this._sort) {
      data = this._sort(data)
    }

    const pks = pluck(this.pk, data.slice(this._max))

    this._coll.findAndRemove({[this.pk]: {$in: pks}})
  }
  drop() {
    this._coll.clear({removeIndices: true})
  }
  all(spec = null): T[] {
    return this._coll.find(spec)
  }
  find(spec = null): T {
    return this._coll.findOne(spec)
  }
  get(k): T | null {
    return this._coll.by(this.pk, k)
  }
  max(k): number {
    return this._coll.max(k)
  }
  watch(f) {
    return watch(this, f)
  }
}

const listener = (() => {
  let listeners = []

  return {
    connect: () => {
      for (const table of Object.values(registry) as Array<Table<any>>) {
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

// Periodically prune data. One table at a time to avoid interfering with the UI
setInterval(() => {
  const tables = Object.values(registry)
  const table = tables[Math.floor(tables.length * Math.random())]

  table.prune()
}, 10_000)

type WatchStore<T> = Writable<T> & {
  refresh: () => void
}

export const watch = (tables, f) => {
  tables = ensurePlural(tables)

  const store = writable(null) as WatchStore<any>
  const names = pluck("name", tables)

  // Initialize synchronously if possible
  const initialValue = f(...tables)
  if (is(Promise, initialValue)) {
    initialValue.then(v => store.set(v))
  } else {
    store.set(initialValue)
  }

  // Debounce refresh so we don't get UI lag
  store.refresh = throttle(50, async () => store.set(await f(...tables)))

  // Listen for changes
  listener.subscribe(name => {
    if (names.includes(name)) {
      store.refresh()
    }
  })

  return store
}

export const dropAll = () => {
  loki.dead = true

  new Promise(resolve => loki.deleteDatabase(resolve))
}

const ready = writable(false)

export const onReady = cb => {
  const unsub = ready.subscribe($ready => {
    if ($ready) {
      cb()
      setTimeout(() => unsub())
    }
  })
}
