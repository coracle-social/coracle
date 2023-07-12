import {is, findIndex, equals} from "ramda"
import {ensurePlural} from "hurdak/lib/hurdak"

export type Readable<T> = {
  notify: () => void
  get: () => T
  subscribe: (f: (v: T) => void) => () => void
}

export type Writable<T> = Readable<T> & {
  set: (v: T) => void
  update: (f: (v: T) => T) => void
}

export type Key<T> = Readable<T> & {
  set: (v: T) => void
  merge: (d: Record<string, T>) => void
  update: (f: (v: T) => T) => void
  remove: () => void
}

export type Collection<T> = Writable<T> & {
  key: (k: string) => Key<T>
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

    return () => subs.splice(findIndex(equals(f), subs), 1)
  }

  return {notify, get, set, update, subscribe}
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

    return () => {
      callerSubs.splice(findIndex(equals(f), callerSubs), 1)

      if (callerSubs.length == 0) {
        for (const unsub of mySubs.splice(0)) {
          unsub()
        }
      }
    }
  }

  return {notify, get, subscribe}
}

export const key = <T>(baseStore, k): Key<T> => {
  if (!is(Map, baseStore.get())) {
    throw new Error("`key` can only be used on map collections")
  }

  const keyStore = derived(baseStore, ([m]) => m.get(k)) as Key<T>

  keyStore.set = v =>
    baseStore.update(m => {
      m.set(k, v)

      return m
    })

  keyStore.merge = d =>
    baseStore.update(m => {
      m.set(k, {...m.get(k), ...d})

      return m
    })

  keyStore.update = f =>
    baseStore.update(m => {
      m.set(k, f(m.get(k)))

      return m
    })

  keyStore.remove = () =>
    baseStore.update(m => {
      m.delete(k)

      return m
    })

  return keyStore
}

export const collection = <T>(): Collection<T> => {
  const baseStore = writable(new Map()) as Collection<T>

  baseStore.key = k => key(baseStore, k)

  return baseStore
}
