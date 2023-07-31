import {is, reject, filter, map, findIndex, equals} from "ramda"
import {ensurePlural} from "hurdak"

type Invalidator<T> = (value?: T) => void
type Derivable = Readable<any> | Readable<any>[]
type Subscriber<T> = (value: T) => void
type Unsubscriber = () => void
type R = Record<string, any>
type M<T> = Map<string, T>

export interface Readable<T> {
  get: () => T
  subscribe(this: void, run: Subscriber<T>, invalidate?: Invalidator<T>): Unsubscriber
  derived: <U>(f: (v: T) => U) => Readable<U>
}

export class Writable<T> implements Readable<T> {
  private value: T
  private subs: Subscriber<T>[] = []

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

  subscribe(f: Subscriber<T>) {
    this.subs.push(f)

    f(this.value)

    return () => {
      const idx = findIndex(equals(f), this.subs)

      this.subs.splice(idx, 1)
    }
  }

  derived<U>(f: (v: T) => U): Derived<U> {
    return new Derived<U>(this, f)
  }
}

export class Derived<T> implements Readable<T> {
  private callerSubs: Subscriber<T>[] = []
  private mySubs: Unsubscriber[] = []
  private value: T = null
  private stores: Derivable
  private getValue: (values: any) => T

  constructor(stores: Derivable, getValue: (values: any) => T) {
    if (!getValue) {
      throw new Error(`Invalid derivation function`)
    }

    this.stores = stores
    this.getValue = getValue
  }

  notify() {
    this.callerSubs.forEach(f => f(this.get()))
  }

  getInput() {
    if (is(Array, this.stores)) {
      return ensurePlural(this.stores).map(s => s.get())
    } else {
      return this.stores.get()
    }
  }

  get = (): T => this.getValue(this.getInput())

  subscribe(f: Subscriber<T>) {
    if (this.callerSubs.length === 0) {
      for (const s of ensurePlural(this.stores)) {
        this.mySubs.push(s.subscribe(() => this.notify()))
      }
    }

    this.callerSubs.push(f)

    f(this.get())

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
    return new Derived(this, f) as Readable<U>
  }
}

export class Key<T extends R> implements Readable<T> {
  readonly pk: string
  readonly key: string
  private base: Writable<M<T>>
  private store: Readable<T>

  constructor(base: Writable<M<T>>, pk: string, key: string) {
    if (!is(Map, base.get())) {
      throw new Error("`key` can only be used on map collections")
    }

    this.pk = pk
    this.key = key
    this.base = base
    this.store = base.derived<T>(m => m.get(key) as T)
  }

  get = () => this.base.get().get(this.key) as T

  subscribe = (f: Subscriber<T>) => this.store.subscribe(f)

  derived = <U>(f: (v: T) => U) => this.store.derived<U>(f)

  exists = () => this.base.get().has(this.key)

  update = (f: (v: T) => T) =>
    this.base.update((m: M<T>) => {
      if (!this.key) {
        throw new Error(`Cannot set key: "${this.key}"`)
      }

      // Make sure the pk always get set on the record
      m.set(this.key, f({...m.get(this.key), [this.pk]: this.key}))

      return m
    })

  set = (v: T) => this.update(() => v)

  merge = (d: Partial<T>) => this.update(v => ({...v, ...d}))

  remove = () =>
    this.base.update(m => {
      m.delete(this.key)

      return m
    })
}

export class Collection<T extends R> implements Readable<T[]> {
  readonly pk: string
  readonly mapStore: Writable<M<T>>
  readonly listStore: Readable<T[]>

  constructor(pk: string) {
    this.pk = pk
    this.mapStore = writable(new Map())
    this.listStore = this.mapStore.derived<T[]>((m: M<T>) => Array.from(m.values()))
  }

  get = () => this.listStore.get()

  getMap = () => this.mapStore.get()

  subscribe = (f: Subscriber<T[]>) => this.listStore.subscribe(f)

  derived = <U>(f: (v: T[]) => U) => this.listStore.derived<U>(f)

  key = (k: string) => new Key(this.mapStore, this.pk, k)

  set = (xs: T[]) => this.mapStore.set(new Map(xs.map(x => [x[this.pk], x])))

  update = (f: (v: T[]) => T[]) =>
    this.mapStore.update(m => new Map(f(Array.from(m.values())).map(x => [x[this.pk], x])))

  reject = (f: (v: T) => boolean) => this.update(reject(f))

  filter = (f: (v: T) => boolean) => this.update(filter(f))

  map = (f: (v: T) => T) => this.update(map(f))
}

export const writable = <T>(v: T) => new Writable(v)

export const derived = <T>(stores: Derivable, getValue: (values: any) => T) =>
  new Derived(stores, getValue) as Readable<T>

export const key = <T extends R>(base: Writable<M<T>>, pk: string, key: string) =>
  new Key<T>(base, pk, key)

export const collection = <T extends R>(pk: string) => new Collection<T>(pk)
