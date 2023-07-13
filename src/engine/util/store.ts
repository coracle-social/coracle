import {is, findIndex, equals} from "ramda"
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

export type Key<T> = Readable<T> & {
  set: (v: T) => void
  merge: (d: Record<string, T>) => void
  update: (f: (v: T) => T) => void
  remove: () => void
}

export type Collection<T> = {
  get: () => T[]
  subscribe: (f: (v: T[]) => void) => () => void
  derived: (f: (v: T[]) => void) => Readable<T[]>
  key: (k: string) => Key<T>
  hasKey: (k: string) => boolean
  getKey: (k: string) => T
  setKey: (k: string, v: T) => void
  mergeKey: (k: string, v: T) => void
  getBaseStore: () => Writable<Map<any, T>>
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

export const key = <T>(baseStore, k): Key<T> => {
  if (!is(Map, baseStore.get())) {
    throw new Error("`key` can only be used on map collections")
  }

  const keyStore = derived(baseStore, m => m.get(k)) as Key<T>

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

  keyStore.derived = f => derived(keyStore, f)

  return keyStore
}

export const collection = <T>(defaults = {}): Collection<T> => {
  const baseStore = writable<Map<any, T>>(new Map(Object.entries(defaults)))
  const arrayStore = derived<T[]>(baseStore, m => Array.from(m.values()))

  return {
    get: () => arrayStore.get(),
    subscribe: f => arrayStore.subscribe(f),
    derived: f => derived(arrayStore, f),
    key: k => key(baseStore, k),
    hasKey: k => baseStore.get().has(k),
    getKey: k => baseStore.get().get(k),
    setKey: (k, v) => {
      baseStore.update(m => {
        m.set(k, v)

        return m
      })
    },
    mergeKey: (k, v) => {
      baseStore.update(m => {
        m.set(k, {...m.get(k), ...v})

        return m
      })
    },
    getBaseStore: () => baseStore,
  }
}
