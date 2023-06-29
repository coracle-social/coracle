import type {Writable} from "svelte/store"
import {bech32, utf8} from "@scure/base"
import {debounce, throttle} from "throttle-debounce"
import {
  without,
  whereEq,
  reject,
  mergeDeepRight,
  isNil,
  is,
  pluck,
  sum,
  identity,
  sortBy,
} from "ramda"
import Fuse from "fuse.js/dist/fuse.min.js"
import {writable} from "svelte/store"
import {isObject, randomId, round} from "hurdak/lib/hurdak"
import {warn} from "src/util/logger"

export const fuzzy = (data, opts = {}) => {
  const fuse = new Fuse(data, opts)

  // Slice pattern because the docs warn that it"ll crash if too long
  return q => (q ? pluck("item", fuse.search(q.slice(0, 32))) : data)
}

export const hash = s =>
  Math.abs(s.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0))

export const getLocalJson = k => {
  try {
    return JSON.parse(localStorage.getItem(k))
  } catch (e) {
    warn(`Unable to parse ${k}: ${e}`)

    return null
  }
}

export const setLocalJson = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch (e) {
    warn(`Unable to set ${k}: ${e}`)
  }
}

export const now = () => Math.round(new Date().valueOf() / 1000)

export const getTimeZone = () => new Date().toString().match(/GMT[^\s]+/)

export const createLocalDate = dateString => new Date(`${dateString} ${getTimeZone()}`)

export const timedelta = (n, unit = "seconds") => {
  switch (unit) {
    case "seconds":
    case "second":
      return n
    case "minutes":
    case "minute":
      return n * 60
    case "hours":
    case "hour":
      return n * 60 * 60
    case "days":
    case "day":
      return n * 60 * 60 * 24
    default:
      throw new Error(`Invalid unit ${unit}`)
  }
}

export const formatTimestamp = ts => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  })

  return formatter.format(new Date(ts * 1000))
}

export const formatTimestampAsDate = ts => {
  const formatter = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return formatter.format(new Date(ts * 1000))
}

export const formatTimestampRelative = ts => {
  let unit
  let delta = now() - ts
  if (delta < timedelta(1, "minute")) {
    unit = "second"
  } else if (delta < timedelta(1, "hour")) {
    unit = "minute"
    delta = Math.round(delta / timedelta(1, "minute"))
  } else if (delta < timedelta(2, "day")) {
    unit = "hour"
    delta = Math.round(delta / timedelta(1, "hour"))
  } else {
    unit = "day"
    delta = Math.round(delta / timedelta(1, "day"))
  }

  const formatter = new Intl.RelativeTimeFormat("en-US", {
    numeric: "auto",
  })

  return formatter.format(-delta, unit as Intl.RelativeTimeFormatUnit)
}

export const formatTimestampAsLocalISODate = ts => {
  const date = new Date(ts * 1000)
  const offset = date.getTimezoneOffset() * 60000
  const datetime = new Date(date.getTime() - offset).toISOString()

  return datetime
}

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export const poll = (t, cb) => {
  let active = true

  ;(async () => {
    while (active) {
      cb()

      await sleep(t)
    }
  })()

  return () => {
    active = false
  }
}

export const createScroller = (
  loadMore,
  {threshold = 3000, reverse = false, element = null} = {}
) => {
  element = element || document.body

  let done = false
  const check = async () => {
    // While we have empty space, fill it
    const {scrollY, innerHeight} = window
    const {scrollHeight, scrollTop} = element
    const offset = scrollTop || scrollY
    const shouldLoad = reverse
      ? offset < threshold
      : offset + innerHeight + threshold > scrollHeight

    // Only trigger loading the first time we reach the threshold
    if (shouldLoad) {
      await loadMore()
    }

    // No need to check all that often
    await sleep(500)

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

export const randomChoice = xs => xs[Math.floor(Math.random() * xs.length)]

export const synced = (key, defaultValue = null) => {
  // If it's an object, merge defaults
  const store = writable(
    isObject(defaultValue)
      ? mergeDeepRight(defaultValue, getLocalJson(key) || {})
      : getLocalJson(key) || defaultValue
  )

  store.subscribe(debounce(1000, $value => setLocalJson(key, $value)))

  return store
}

// DANGER: don't use this if it's disposable, it does not clean up subscriptions,
// and will cause a memory leak
export const getter = store => {
  let value

  store.subscribe(_value => {
    value = _value
  })

  return () => value
}

export const shuffle = sortBy(() => Math.random() > 0.5)

export const batch = (t, f) => {
  const xs = []
  const cb = throttle(t, () => xs.length > 0 && f(xs.splice(0)))

  return x => {
    xs.push(x)
    cb()
  }
}

export type Deferred<T> = Promise<T> & {
  resolve: (arg?: T) => void
  reject: (arg?: T) => void
}

export const defer = (): Deferred<any> => {
  let resolve, reject
  const p = new Promise((resolve_, reject_) => {
    resolve = resolve_
    reject = reject_
  })

  return Object.assign(p, {resolve, reject})
}

export const avg = xs => (xs.length > 0 ? sum(xs) / xs.length : 0)

// https://stackoverflow.com/a/21682946
export const stringToHue = value => {
  let hash = 0
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }

  return hash % 360
}

export const hsl = (hue, {saturation = 100, lightness = 50, opacity = 1} = {}) =>
  `hsl(${hue}, ${saturation}%, ${lightness}%, ${opacity})`

export const tryFunc = (f, ignore = null) => {
  try {
    const r = f()

    if (is(Promise, r)) {
      return r.catch(e => {
        if (!ignore || !e.toString().includes(ignore)) {
          warn(e)
        }
      })
    } else {
      return r
    }
  } catch (e) {
    if (ignore === false) {
      return
    }

    if (ignore && e.toString().includes(ignore)) {
      return
    }

    warn(e)
  }
}

export const tryJson = f => tryFunc(f, "JSON")
export const tryFetch = f => tryFunc(f, "fetch")

export const union = (...sets) => new Set(sets.flatMap(s => Array.from(s)))

export const difference = (a, b) => new Set(Array.from(a).filter(x => !b.has(x)))

export const quantile = (a, q) => {
  const sorted = sortBy(identity, a)
  const pos = (sorted.length - 1) * q
  const base = Math.floor(pos)
  const rest = pos - base

  return isNil(sorted[base + 1])
    ? sorted[base]
    : sorted[base] + rest * (sorted[base + 1] - sorted[base])
}

type FetchOpts = {
  method?: string
  headers?: Record<string, string | boolean>
  body?: string | FormData
}

export const fetchJson = async (url, opts: FetchOpts = {}) => {
  if (!opts.headers) {
    opts.headers = {}
  }

  opts.headers["Accept"] = "application/json"

  const res = await fetch(url, opts as RequestInit)
  const json = await res.json()

  return json
}

export const postJson = async (url, data, opts: FetchOpts = {}) => {
  if (!opts.method) {
    opts.method = "POST"
  }

  if (!opts.headers) {
    opts.headers = {}
  }

  opts.headers["Content-Type"] = "application/json"
  opts.body = JSON.stringify(data)

  return fetchJson(url, opts)
}

export const uploadFile = (url, fileObj) => {
  const body = new FormData()

  body.append("file", fileObj)

  return fetchJson(url, {method: "POST", body})
}

export const hexToBech32 = (prefix, url) =>
  bech32.encode(prefix, bech32.toWords(utf8.decode(url)), false)

export const bech32ToHex = b32 => utf8.encode(bech32.fromWords(bech32.decode(b32, false).words))

export const numberFmt = new Intl.NumberFormat()

export const formatSats = sats => {
  if (sats < 1_000) return numberFmt.format(sats)
  if (sats < 1_000_000) return numberFmt.format(round(1, sats / 1000)) + "K"
  if (sats < 100_000_000) return numberFmt.format(round(1, sats / 1_000_000)) + "MM"
  return numberFmt.format(round(2, sats / 100_000_000)) + "BTC"
}

type EventBusListener = {
  id: string
  handler: (...args: any[]) => void
}

export class EventBus {
  listeners: Record<string, Array<EventBusListener>> = {}
  on(name, handler) {
    const id = randomId()

    this.listeners[name] = this.listeners[name] || ([] as Array<EventBusListener>)
    this.listeners[name].push({id, handler})

    return id
  }
  off(name, id) {
    this.listeners[name] = reject(whereEq({id}), this.listeners[name])
  }
  handle(k, ...payload) {
    for (const {handler} of this.listeners[k] || []) {
      handler(...payload)
    }
  }
}

export const annotateMedia = url => {
  if (url.match(/\.(jpg|jpeg|png|gif)/)) {
    return {type: "image", url}
  } else if (url.match(/\.(mov|mp4)/)) {
    return {type: "video", url}
  } else {
    return {type: "preview", url}
  }
}

export class WritableList<T> {
  _store: Writable<Array<T>>
  constructor(init) {
    this._store = writable(init)
  }
  subscribe(f) {
    return this._store.subscribe(f)
  }
  set(xs) {
    this._store.set(xs)
  }
  update(f) {
    this._store.update(f)
  }
  add(x) {
    this._store.update(xs => xs.concat(x))
  }
  remove(x) {
    this._store.update(xs => without([x], xs))
  }
  toggle(x) {
    this._store.update(xs => (xs.includes(x) ? without([x], xs) : xs.concat(x)))
  }
}

export const shadeColor = (color, percent) => {
  let R = parseInt(color.substring(1, 3), 16)
  let G = parseInt(color.substring(3, 5), 16)
  let B = parseInt(color.substring(5, 7), 16)

  R = (R * (100 + percent)) / 100
  G = (G * (100 + percent)) / 100
  B = (B * (100 + percent)) / 100

  R = R < 255 ? R : 255
  G = G < 255 ? G : 255
  B = B < 255 ? B : 255

  R = Math.round(R)
  G = Math.round(G)
  B = Math.round(B)

  const RR = R.toString(16).length == 1 ? "0" + R.toString(16) : R.toString(16)
  const GG = G.toString(16).length == 1 ? "0" + G.toString(16) : G.toString(16)
  const BB = B.toString(16).length == 1 ? "0" + B.toString(16) : B.toString(16)

  return "#" + RR + GG + BB
}

export const base64DecodeOrPlainWebSocketURL = (data: string): string => {
  try {
    return atob(data)
  } catch (err) {
    if (data.startsWith("ws://") || data.startsWith("wss://")) {
      return data
    }

    return "wss://" + data
  }
}

export const webSocketURLToPlainOrBase64 = (url: string): string => {
  if (url.startsWith("ws://")) {
    return btoa(url)
  }

  if (url.startsWith("wss://")) {
    url = url.slice(6)
  }

  if (url.includes("/")) {
    return btoa(url)
  }

  return url
}

export const clamp = ([min, max], n) => Math.min(max, Math.max(min, n))
