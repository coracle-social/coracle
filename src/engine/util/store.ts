import {is, reject, filter, map, findIndex, equals} from "ramda"
import {ensurePlural} from "hurdak"

type Derivable = Readable<any> | Readable<any>[]
type Unsubscriber = () => void
type Subscriber = <T>(v: T) => void | Unsubscriber
type R = Record<string, any>
type M = Map<string, R>

export interface Readable<T> {
  get: () => T | undefined
  subscribe: (f: Subscriber) => () => void
  derived: <U>(f: <T>(v: T) => U) => Readable<U>
}

export class Writable<T> implements Readable<T> {
  private value: T
  private subs: Subscriber[] = []

  constructor(defaultValue: T) {
    this.value = defaultValue
  }

  notify() {
    for (const sub of this.subs) {
      sub(this.value)
    }
  }

  get() {
    return this.value
  }

  set(newValue: T) {
    this.value = newValue
    this.notify()
  }

  update(f: (v: T) => T) {
    this.value = f(this.value)
    this.notify()
  }

  subscribe(f: Subscriber) {
    this.subs.push(f)
    this.notify()

    return () => {
      const idx = findIndex(equals(f), this.subs)

      this.subs.splice(idx, 1)
    }
  }

  derived<U>(f: (v: T) => U): Derived<U> {
    return new Derived<U>([this], f)
  }
}

export class Derived<T> implements Readable<T> {
  private callerSubs: Subscriber[] = []
  private mySubs: Unsubscriber[] = []
  private stores: Derivable
  private getValue: (values: any) => T

  constructor(stores: Derivable, getValue: (values: any) => T) {
    this.stores = stores
    this.getValue = getValue
  }

  notify() {
    this.callerSubs.forEach(f => f(this.get()))
  }

  get() {
    const isMulti = is(Array, this.stores)
    const inputs = ensurePlural(this.stores).map(s => s.get())

    return this.getValue(isMulti ? inputs : inputs[0])
  }

  subscribe(f: Subscriber) {
    if (this.callerSubs.length === 0) {
      for (const s of ensurePlural(this.stores)) {
        this.mySubs.push(s.subscribe(() => this.notify()))
      }
    }

    this.callerSubs.push(f)
    this.notify()
    return () => {
      const idx = findIndex(equals(f), this.callerSubs)

      this.callerSubs.splice(idx, 1)

      if (this.callerSubs.length === 0) {
        for (const unsub of this.mySubs.splice(0)) {
          unsub()
        }
      }
    }
  }

  derived<U>(f: (v: T) => U): Readable<U> {
    return new Derived([this], f) as Readable<U>
  }
}

export class Key implements Readable<R> {
  readonly pk: string
  readonly key: string
  private base: Writable<M>
  private store: Readable<R>

  constructor(base: Writable<M>, pk: string, key: string) {
    if (!is(Map, base.get())) {
      throw new Error("`key` can only be used on map collections")
    }

    this.pk = pk
    this.key = key
    this.base = base
    this.store = base.derived<R>(m => m.get(key) as R)
  }

  get = () => this.base.get().get(this.key)

  subscribe = (f: Subscriber) => this.store.subscribe(f)

  derived = <U>(f: <V>(v: V) => U) => this.store.derived<U>(f)

  exists = () => this.base.get().has(this.key)

  update = (f: (v: R) => R) =>
    this.base.update((m: M) => {
      if (!this.key) {
        throw new Error(`Cannot set key: "${this.key}"`)
      }

      const v = f(m.get(this.key) as R) as Record<string, any>

      // Make sure the pk always get set on the record
      if (v) {
        v[this.pk] = this.key

        m.set(this.key, v as R)
      }

      return m
    })

  set = (v: R) => this.update(() => v)

  merge = (d: R) => this.update(v => ({...v, ...d}))

  remove = () =>
    this.base.update(m => {
      m.delete(this.key)

      return m
    })
}

export class Collection implements Readable<R[]> {
  readonly pk: string
  #map: Writable<M>
  #list: Readable<R[]>

  constructor(pk: string) {
    this.pk = pk
    this.#map = writable(new Map())
    this.#list = this.#map.derived<R[]>((m: M) => Array.from(m.values()))
  }

  get = () => this.#list.get()

  getMap = () => this.#map.get()

  subscribe = (f: Subscriber) => this.#list.subscribe(f)

  derived = <U>(f: <V>(v: V) => U) => this.#list.derived<U>(f)

  key = (k: string) => new Key(this.#map, this.pk, k)

  set = (xs: R[]) => this.#map.set(new Map(xs.map(x => [x[this.pk], x])))

  update = (f: (v: R[]) => R[]) =>
    this.#map.update(m => new Map(f(Array.from(m.values())).map(x => [x[this.pk], x])))

  reject = (f: (v: R) => boolean) => this.update(reject(f))

  filter = (f: (v: R) => boolean) => this.update(filter(f))

  map = (f: (v: R) => R) => this.update(map(f))
}

export const writable = <T>(v: T) => new Writable(v)

export const derived = <U>(stores: Derivable, getValue: (values: any) => U) =>
  new Derived(stores, getValue) as Readable<U>

export const key = (base: Writable<M>, pk: string, key: string) => new Key(base, pk, key)

export const collection = (pk: string) => new Collection(pk)
