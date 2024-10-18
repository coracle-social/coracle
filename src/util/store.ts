import {throttle} from "throttle-debounce"
import {ensurePlural, identity} from "@welshman/lib"

// Deprecated: use svelte's stores instead. I did all this to add a `get` convenience
// method that was more perfomant than subscribing/unsubscribing. That turned out to be
// a mistake, since that makes it much harder to make custom stores that don't run when
// there are no subscribers.

export type Invalidator<T> = (value?: T) => void
export type Subscriber<T> = (value: T) => void

type Derivable = IDerivable<any> | IDerivable<any>[]
type Unsubscriber = () => void
type R = Record<string, any>
type M<T> = Map<string, T>

export interface ISubscribable<T> {
  subscribe(this: void, run: Subscriber<T>, invalidate?: Invalidator<T>): Unsubscriber
}

export interface ISettable<T> {
  set: (xs: T) => void
}

export interface IDerivable<T> extends ISubscribable<T> {
  get: () => T
}

export interface IReadable<T> extends IDerivable<T> {
  derived: <U>(f: (v: T) => U) => IReadable<U>
  throttle(t: number): IReadable<T>
}

export interface IWritable<T> extends IReadable<T> {
  set: (xs: T) => void
}

export class Writable<T> implements IWritable<T> {
  value: T
  subs: Subscriber<T>[] = []

  constructor(defaultValue: T, t?: number) {
    this.value = defaultValue

    if (t) {
      this.notify = throttle(t, this.notify)
    }
  }

  notify = () => {
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
    this.set(f(this.value))
  }

  subscribe(f: Subscriber<T>) {
    this.subs.push(f)

    f(this.value)

    return () => {
      this.subs.splice(
        this.subs.findIndex(x => x === f),
        1,
      )
    }
  }

  derived<U>(f: (v: T) => U): Derived<U> {
    return new Derived<U>(this, f)
  }

  throttle = (t: number): Derived<T> => {
    return new Derived<T>(this, identity, t)
  }
}

export class Derived<T> implements IReadable<T> {
  callerSubs: Subscriber<T>[] = []
  mySubs: Unsubscriber[] = []
  stores: Derivable
  getValue: (values: any) => T
  latestValue: T | undefined

  constructor(stores: Derivable, getValue: (values: any) => T, t = 0) {
    this.stores = stores
    this.getValue = getValue

    if (t) {
      this.notify = throttle(t, this.notify)
    }
  }

  notify = () => {
    this.latestValue = undefined
    this.callerSubs.forEach(f => f(this.get()))
  }

  getInput() {
    if (Array.isArray(this.stores)) {
      return this.stores.map(s => s.get())
    } else {
      return this.stores.get()
    }
  }

  get = (): T => {
    // Recalculate if we're not subscribed, because we won't get notified when deps change
    if (this.latestValue === undefined || this.mySubs.length === 0) {
      this.latestValue = this.getValue(this.getInput())
    }

    return this.latestValue
  }

  subscribe(f: Subscriber<T>) {
    if (this.callerSubs.length === 0) {
      for (const s of ensurePlural(this.stores)) {
        this.mySubs.push(s.subscribe(this.notify))
      }
    }

    this.callerSubs.push(f)

    f(this.get())

    return () => {
      this.callerSubs.splice(
        this.callerSubs.findIndex(x => x === f),
        1,
      )

      if (this.callerSubs.length === 0) {
        for (const unsub of this.mySubs.splice(0)) {
          unsub()
        }
      }
    }
  }

  derived<U>(f: (v: T) => U): IReadable<U> {
    return new Derived(this, f) as IReadable<U>
  }

  throttle = (t: number): IReadable<T> => {
    return new Derived<T>(this, identity, t)
  }
}

export class Key<T extends R> implements IReadable<T> {
  readonly pk: string
  readonly key: string
  base: Writable<M<T>>
  store: IReadable<T>

  constructor(base: Writable<M<T>>, pk: string, key: string) {
    if (!(base.get() instanceof Map)) {
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

  throttle = (t: number) => this.store.throttle(t)

  exists = () => this.base.get().has(this.key)

  update = (f: (v: T) => T) =>
    this.base.update((m: M<T>) => {
      if (!this.key) {
        throw new Error(`Cannot set key: "${this.key}"`)
      }

      // Make sure the pk always get set on the record
      const {pk, key} = this
      const oldValue = {...m.get(key), [pk]: key} as T
      const newValue = {...f(oldValue), [pk]: key}

      m.set(this.key, newValue)

      return m
    })

  set = (v: T) => this.update(() => v)

  merge = (d: Partial<T>) => this.update(v => ({...v, ...d}))

  remove = () =>
    this.base.update(m => {
      m.delete(this.key)

      return m
    })

  pop = () => {
    const v = this.get()

    this.remove()

    return v
  }
}

export class DerivedKey<T extends R> implements IReadable<T> {
  readonly pk: string
  readonly key: string
  base: IReadable<M<T>>
  store: IReadable<T>

  constructor(base: IReadable<M<T>>, pk: string, key: string) {
    if (!(base.get() instanceof Map)) {
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

  throttle = (t: number) => this.store.throttle(t)

  exists = () => this.base.get().has(this.key)
}

export class Collection<T extends R> implements IReadable<T[]> {
  readonly pk: string
  readonly mapStore: Writable<M<T>>
  readonly listStore: IReadable<T[]>

  constructor(pk: string, t?: number) {
    this.pk = pk
    this.mapStore = new Writable(new Map())
    this.listStore = this.mapStore.derived<T[]>((m: M<T>) => Array.from(m.values()))

    if (t) {
      this.mapStore.notify = throttle(t, this.mapStore.notify)
    }
  }

  get = () => this.listStore.get()

  getMap = () => this.mapStore.get()

  subscribe = (f: Subscriber<T[]>) => this.listStore.subscribe(f)

  derived = <U>(f: (v: T[]) => U) => this.listStore.derived<U>(f)

  throttle = (t: number) => this.listStore.throttle(t)

  key = (k: string) => new Key(this.mapStore, this.pk, k)

  set = (xs: T[]) => {
    const m = new Map()

    for (const x of xs) {
      if (!x) {
        console.error("Empty value passed to collection store")
      } else if (!x[this.pk]) {
        console.error(`Value with empty ${this.pk} passed to collection store`, x)
      } else {
        m.set(x[this.pk], x)
      }
    }

    this.mapStore.set(m)
  }

  update = (f: (v: T[]) => T[]) => this.set(f(this.get()))

  updateAsync = async (f: (v: T[]) => Promise<T[]>) => this.set(await f(this.get()))

  reject = (f: (v: T) => boolean) => this.update((xs: T[]) => xs.filter(x => !f(x)))

  filter = (f: (v: T) => boolean) => this.update((xs: T[]) => xs.filter(f))

  map = (f: (v: T) => T) => this.update((xs: T[]) => xs.map(f))
}
