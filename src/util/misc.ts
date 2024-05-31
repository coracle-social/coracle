import {throttle} from "throttle-debounce"
import {writable} from "svelte/store"
import type {Readable, Writable} from "svelte/store"
import {now, stripProtocol} from "@welshman/lib"
import {pluck, fromPairs, last, identity, sum, is, equals} from "ramda"
import {Storage, ensurePlural, defer, isPojo, first, seconds, tryFunc, sleep, round} from "hurdak"
import Fuse from "fuse.js"
import logger from "src/util/logger"

export const fuzzy = <T>(data: T[], opts = {}) => {
  const fuse = new Fuse(data, opts) as any

  // Slice pattern because the docs warn that it"ll crash if too long
  return (q: string) => {
    return q ? pluck("item", fuse.search(q.slice(0, 32)) as any[]) : data
  }
}

export const secondsToDate = ts => new Date(parseInt(ts) * 1000)

export const dateToSeconds = date => Math.round(date.valueOf() / 1000)

export const getTimeZone = () => new Date().toString().match(/GMT[^\s]+/)

export const createLocalDate = (dateString: any) => new Date(`${dateString} ${getTimeZone()}`)

export const getLocale = () => new Intl.DateTimeFormat().resolvedOptions().locale

export const formatTimestamp = (ts: number) => {
  const formatter = new Intl.DateTimeFormat(getLocale(), {
    dateStyle: "short",
    timeStyle: "short",
  })

  return formatter.format(new Date(ts * 1000))
}

export const formatTimestampAsDate = (ts: number) => {
  const formatter = new Intl.DateTimeFormat(getLocale(), {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return formatter.format(new Date(ts * 1000))
}

export const formatTimestampRelative = (ts: number) => {
  let unit
  let delta = now() - ts
  if (delta < seconds(1, "minute")) {
    unit = "second"
  } else if (delta < seconds(1, "hour")) {
    unit = "minute"
    delta = Math.round(delta / seconds(1, "minute"))
  } else if (delta < seconds(2, "day")) {
    unit = "hour"
    delta = Math.round(delta / seconds(1, "hour"))
  } else {
    unit = "day"
    delta = Math.round(delta / seconds(1, "day"))
  }

  const locale = new Intl.RelativeTimeFormat().resolvedOptions().locale
  const formatter = new Intl.RelativeTimeFormat(locale, {
    numeric: "auto",
  })

  return formatter.format(-delta, unit as Intl.RelativeTimeFormatUnit)
}

export const formatDateAsLocalISODate = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000
  const datetime = new Date(date.getTime() - offset).toISOString()

  return datetime
}

export const formatTimestampAsLocalISODate = (ts: number) => {
  return formatDateAsLocalISODate(new Date(ts * 1000))
}

type ScrollerOpts = {
  delay?: number
  threshold?: number
  reverse?: boolean
  element?: Element
}

export const createScroller = (
  loadMore: () => Promise<void>,
  {delay = 1000, threshold = 2000, reverse = false, element}: ScrollerOpts = {},
) => {
  element = element.closest(".modal-content") || element

  let done = false
  const check = async () => {
    // While we have empty space, fill it
    const {scrollY, innerHeight} = window
    const {scrollHeight, scrollTop} = element
    const offset = Math.abs(scrollTop || scrollY)
    const shouldLoad = offset + innerHeight + threshold > scrollHeight

    // Only trigger loading the first time we reach the threshold
    if (shouldLoad) {
      await loadMore()
    }

    // No need to check all that often
    await sleep(delay)

    if (!done) {
      requestAnimationFrame(check)
    }
  }

  requestAnimationFrame(check)

  return {
    check,
    stop: () => {
      done = true
    },
  }
}

// https://stackoverflow.com/a/21682946
export const stringToHue = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }

  return hash % 360
}

export const hsl = (hue: number, {saturation = 100, lightness = 50, opacity = 1} = {}) =>
  `hsl(${hue}, ${saturation}%, ${lightness}%, ${opacity})`

export const tryJson = <T>(f: () => T) =>
  tryFunc(f, (e: Error) => {
    if (!e.toString().includes("JSON")) {
      logger.warn(e)
    }
  })

export const tryFetch = <T>(f: () => T) =>
  tryFunc(f, (e: Error) => {
    if (!e.toString().includes("fetch")) {
      logger.warn(e)
    }
  })

export const numberFmt = new Intl.NumberFormat()

export const formatSats = (sats: number) => {
  if (sats < 1_000) return numberFmt.format(sats)
  if (sats < 1_000_000) return numberFmt.format(round(1, sats / 1000)) + "K"
  if (sats < 100_000_000) return numberFmt.format(round(1, sats / 1_000_000)) + "MM"
  return numberFmt.format(round(2, sats / 100_000_000)) + "BTC"
}

export const pushToKey = <T>(m: Record<string, T[]> | Map<string, T[]>, k: string, v: T) => {
  if (m instanceof Map) {
    const a = m.get(k) || []

    a.push(v)
    m.set(k, a)
  } else {
    m[k] = m[k] || []
    m[k].push(v)
  }

  return m
}

export const race = (threshold, promises) => {
  let count = 0

  if (threshold === 0) {
    return Promise.resolve()
  }

  return new Promise<void>((resolve, reject) => {
    promises.forEach(p => {
      p.then(() => {
        count++

        if (count >= threshold) {
          resolve()
        }
      }).catch(reject)
    })
  })
}

export const displayUrl = url => {
  return stripProtocol(url)
    .replace(/^(www\.)?/i, "")
    .replace(/\/$/, "")
}

export const displayDomain = url => {
  return first(displayUrl(url).split(/[\/\?]/))
}

export const memoize = <T>(f: (...args: any[]) => T) => {
  let prevArgs
  let result: T

  return (...args) => {
    if (!equals(prevArgs, args)) {
      prevArgs = args
      result = f(...args)
    }

    return result
  }
}

// https://stackoverflow.com/a/11900218/1467342
export function roughSizeOfObject(o, max = Infinity) {
  const seen = new Set()
  const stack = [o]
  let bytes = 0

  while (stack.length) {
    const value = stack.pop()

    if (typeof value === "boolean") {
      bytes += 4
    } else if (typeof value === "string") {
      bytes += value.length * 2
    } else if (typeof value === "number") {
      bytes += 8
    } else if (isPojo(value) && !seen.has(value)) {
      seen.add(value)

      for (const [k, v] of Object.entries(value)) {
        stack.push(k)
        stack.push(v)
      }
    } else if (is(Map, value) && !seen.has(value)) {
      seen.add(value)

      for (const [k, v] of value.entries()) {
        stack.push(k)
        stack.push(v)
      }
    } else if (Array.isArray(value) && !seen.has(value)) {
      seen.add(value)

      for (const v of value) {
        stack.push(v)
      }
    } else if (is(Set, value) && !seen.has(value)) {
      seen.add(value)

      for (const v of value.values()) {
        stack.push(v)
      }
    }

    if (bytes > max) {
      return max
    }
  }

  return bytes
}

export const sumBy = (f, xs) => sum(xs.map(f))

export const ensureProto = url => (url.includes("://") ? url : "https://" + url)

export const createBatcher = <T, U>(t, execute: (request: T[]) => U[] | Promise<U[]>) => {
  const queue = []

  const _execute = async () => {
    const items = queue.splice(0)
    const results = await execute(pluck("request", items))

    if (results.length !== items.length) {
      logger.warn("Execute must return a promise for each request", results, items)
    }

    results.forEach(async (r, i) => items[i].deferred.resolve(await r))
  }

  return (request: T): Promise<U> => {
    const deferred = defer<U>()

    if (queue.length === 0) {
      setTimeout(_execute, t)
    }

    queue.push({request, deferred})

    return deferred
  }
}

export const asArray = v => ensurePlural(v).filter(identity)

export const buildQueryString = params => "?" + new URLSearchParams(params)

export const parseQueryString = path =>
  fromPairs(Array.from(new URLSearchParams(last(path.split("?")))))

export const joinPath = (...parts) => {
  let path = ""

  for (let part of parts) {
    if (!part.endsWith("/")) {
      part += "/"
    }

    path += part
  }

  return path.slice(0, -1)
}

export const updateIn =
  <T>(k: string, f: (x: T) => T) =>
  x => ({...x, [k]: f(x[k])})

export const pickVals = <T>(ks: string[], x: Record<string, T>) => ks.map(k => x[k])

export const getStringWidth = (text: string) => {
  const span = document.createElement("span")

  span.setAttribute("style", "height: 0px")
  span.textContent = text

  document.body.appendChild(span)

  const {width} = span.getBoundingClientRect()

  span.remove()

  return width
}

export class SearchHelper<T, V> {
  config: Record<string, any> = {}
  _optionsByValue = new Map<V, T>()
  _search?: (term: string) => T[]

  constructor(readonly options: T[]) {}

  _setup() {
    if (!this._search) {
      for (const option of this.options) {
        this._optionsByValue.set(this.getValue(option), option)
      }

      this._search = this.getSearch()
    }

    return this
  }

  getSearch = () => fuzzy(this.options, this.config)

  getOption = (value: V) => this._optionsByValue.get(value)

  getValue = (option: T) => option as unknown as V

  displayValue = (value: V) => String(value)

  displayOption = (option: T) => this.displayValue(this.getValue(option))

  searchOptions = (term: string) => this._setup()._search(term)

  searchValues = (term: string) => this.searchOptions(term).map(this.getValue)
}

export const fromCsv = s => (s || "").split(",").filter(identity)

export const toSpliced = <T>(xs: T[], start: number, deleteCount: number = 0, ...items: T[]) => [
  ...xs.slice(0, start),
  ...items,
  ...xs.slice(start + deleteCount),
]

// Local storage

export const synced = <T>(key: string, defaultValue: T, delay = 300) => {
  const store = writable<T>(Storage.getJson(key) || defaultValue)

  store.subscribe(throttle(delay, ($value: T) => Storage.setJson(key, $value)))

  return store
}

export const getter = <T>(store: Readable<T>) => {
  let value: T

  store.subscribe((newValue: T) => {
    value = newValue
  })

  return () => value
}

type Stop = () => void
type Setter<T> = (x: T) => T
type Sub<T> = (x: T) => void
type Start<T> = (set: Setter<T>) => Stop

export const custom = <T>(start: Start<T>, opts: {throttle?: number} = {}) => {
  const subs: Sub<T>[] = []

  let value: T
  let stop: () => void

  return {
    subscribe: (sub: Sub<T>) => {
      if (opts.throttle) {
        sub = throttle(opts.throttle, sub)
      }

      if (subs.length === 0) {
        stop = start((newValue: T) => {
          for (const sub of subs) {
            sub(newValue)
          }

          value = newValue

          return newValue
        })
      }

      subs.push(sub)
      sub(value)

      return () => {
        subs.splice(
          subs.findIndex(s => s === sub),
          1,
        )

        if (subs.length === 0) {
          stop()
        }
      }
    },
  }
}

export function withGetter<T>(store: Writable<T>): Writable<T> & {get: () => T}
export function withGetter<T>(store: Readable<T>): Readable<T> & {get: () => T}
export function withGetter<T>(store: Readable<T> | Writable<T>) {
  return {...store, get: getter<T>(store)}
}

export const throttled = <T>(delay: number, store: Readable<T>) =>
  custom(set => store.subscribe(throttle(delay, set)))
