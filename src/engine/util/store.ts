import {is, reject, filter, map, findIndex, equals} from "ramda"
import {ensurePlural} from "hurdak/lib/hurdak"

export type Readable<T> = {
  notify: () => void
  get: () => T
  subscribe: (f: (v: T) => void) => () => void
  derived: (f: (v: T) => void) => Readable<T>
}

export type Writable<T> = Readable<T> & {
  set: (v: T) => void
  update: (f: (v: T) => T) => void
}

export const writable = <T>(defaultValue = null): Writable<T> => {
  let value = defaultValue
  const subs = []

  const notify = () => {
    for (const sub of subs) {
      sub(value)
    }
  }

  const get = () => value

  const set = newValue => {
    value = newValue

    notify()
  }

  const update = f => {
    value = f(value)

    notify()
  }

  const subscribe = f => {
    subs.push(f)

    notify()

    return () => subs.splice(findIndex(equals(f), subs), 1)
  }

  const derived_ = f => derived<T>({get, subscribe}, f)

  return {notify, get, set, update, subscribe, derived: derived_}
}

export const derived = <T>(stores, getValue): Readable<T> => {
  const callerSubs = []
  const mySubs = []

  const get = () => getValue(Array.isArray(stores) ? stores.map(s => s.get()) : stores.get())

  const notify = () => callerSubs.forEach(f => f(get()))

  const subscribe = f => {
    if (callerSubs.length === 0) {
      for (const s of ensurePlural(stores)) {
        mySubs.push(s.subscribe(v => notify()))
      }
    }

    callerSubs.push(f)

    notify()

    return () => {
      callerSubs.splice(findIndex(equals(f), callerSubs), 1)

      if (callerSubs.length == 0) {
        for (const unsub of mySubs.splice(0)) {
          unsub()
        }
      }
    }
  }

  const derived_ = f => derived<T>({get, subscribe}, f)

  return {notify, get, subscribe, derived: derived_}
}

export class Key<T> {
  readonly pk: string
  readonly key: string
  #base: Writable<Map<string, T>>
  #store: Readable<T[]>

  constructor(base, pk, key) {
    if (!is(Map, base.get())) {
      throw new Error("`key` can only be used on map collections")
    }

    this.pk = pk
    this.key = key
    this.#base = base
    this.#store = derived(base, m => m.get(key))
  }

  get = () => this.#base.get().get(this.key)

  subscribe = f => this.#store.subscribe(f)

  derived = f => this.#store.derived(f)

  exists = () => this.#base.get().has(this.key)

  update = f =>
    this.#base.update(m => {
      const v = f(m.get(this.key))

      // Make sure the pk always get set on the record
      v[this.pk] = this.key

      m.set(this.key, v)

      return m
    })

  set = v => this.update(() => v)

  merge = d => this.update(v => ({...v, ...d}))

  remove = () =>
    this.#base.update(m => {
      m.delete(this.key)

      return m
    })
}

export class Collection<T> {
  readonly pk: string
  #map: Writable<Map<string, T>>
  #list: Readable<T[]>

  constructor(pk) {
    this.pk = pk
    this.#map = writable(new Map())
    this.#list = derived(this.#map, m => Array.from(m.values())) as Readable<T[]>
  }

  get = () => this.#list.get()

  getMap = () => this.#map.get()

  subscribe = f => this.#list.subscribe(f)

  derived = f => this.#list.derived(f)

  key = k => new Key<T>(this.#map, this.pk, k)

  set = xs => this.#map.set(new Map(xs.map(x => [x[this.pk], x])))

  update = f => this.#map.update(m => new Map(f(Array.from(m.values())).map(x => [x[this.pk], x])))

  reject = f => this.update(reject(f))

  filter = f => this.update(filter(f))

  map = f => this.update(map(f))
}

export const collection = <T>(pk) => new Collection<T>(pk)
