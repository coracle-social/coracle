import {bech32, utf8} from "@scure/base"
import {debounce, throttle} from "throttle-debounce"
import {
  gt,
  mergeDeepRight,
  aperture,
  path as getPath,
  allPass,
  pipe,
  isNil,
  complement,
  equals,
  is,
  pluck,
  sum,
  identity,
  sortBy,
} from "ramda"
import Fuse from "fuse.js/dist/fuse.min.js"
import {writable} from "svelte/store"
import {isObject, round} from "hurdak/lib/hurdak"
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

export const createScroller = (loadMore, {reverse = false} = {}) => {
  const THRESHOLD = 1200

  // NOTE TO FUTURE SELF
  // If the scroller is saturating request channels on a slow relay, the
  // loadMore function is not properly awaiting all the work necessary.
  // That is the problem, but see commit 8371fde for another strategy
  let done = false
  const check = async () => {
    // While we have empty space, fill it
    const {scrollY, innerHeight} = window
    const {scrollHeight} = document.body
    const shouldLoad = reverse
      ? scrollY < THRESHOLD
      : scrollY + innerHeight + THRESHOLD > scrollHeight

    // Only trigger loading the first time we reach the threshold
    if (shouldLoad) {
      await loadMore()
    }

    // No need to check all that often
    await sleep(1000)

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

export class Cursor {
  until: number
  limit: number
  count: number
  constructor(limit = 20) {
    this.until = now()
    this.limit = limit
    this.count = 0
  }
  getFilter() {
    return {
      until: this.until,
      limit: this.limit,
    }
  }
  // Remove events that are significantly older than the average
  prune(events) {
    const maxDiff = avg(events.map(e => this.until - e.created_at)) * 4

    return events.filter(e => this.until - e.created_at < maxDiff)
  }
  // Calculate a reasonable amount to move our window to avoid fetching too much of the
  // same stuff we already got without missing certain time periods due to a mismatch
  // in event density between various relays
  update(events) {
    if (events.length > 2) {
      // Keep track of how many requests we've made
      this.count += 1

      // Find the average gap between events to figure out how regularly people post to this
      // feed. Multiply it by the number of events we have but scale down to avoid
      // blowing past big gaps due to misbehaving relays skewing the results. Trim off
      // outliers and scale based on results/requests to help with that
      const timestamps = sortBy(identity, pluck("created_at", events))
      const gaps = aperture(2, timestamps).map(([a, b]) => b - a)
      const high = quantile(gaps, 0.5)
      const gap = avg(gaps.filter(gt(high)))

      // If we're just warming up, scale the window down even further to avoid
      // blowing past the most relevant time period
      const scale = Math.min(1, Math.log10(events.length)) * Math.min(1, Math.log10(this.count + 1))

      // Only paginate part of the way so we can avoid missing stuff
      this.until -= Math.round(gap * scale * this.limit)
    }
  }
}

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
  resolve: (arg: T) => void
  reject: (arg: T) => void
}

export const defer = (): Deferred<any> => {
  let resolve, reject
  const p = new Promise((resolve_, reject_) => {
    resolve = resolve_
    reject = reject_
  })

  return Object.assign(p, {resolve, reject})
}

export const avg = xs => sum(xs) / xs.length

export const where = filters =>
  allPass(
    Object.entries(filters).map(([key, value]) => {
      /* eslint prefer-const: 0 */
      let [field, operator = "eq"] = key.split(":")
      let test,
        modifier = identity,
        parts = field.split(".")

      if (operator.startsWith("!")) {
        operator = operator.slice(1)
        modifier = complement
      }

      if (operator === "eq" && is(Array, value)) {
        test = v => (value as Array<any>).includes(v)
      } else if (operator === "eq") {
        test = equals(value)
      } else if (operator === "lt") {
        test = v => (v || 0) < value
      } else if (operator === "lte") {
        test = v => (v || 0) <= value
      } else if (operator === "gt") {
        test = v => (v || 0) > value
      } else if (operator === "gte") {
        test = v => (v || 0) >= value
      } else if (operator === "nil") {
        test = isNil
      } else {
        throw new Error(`Invalid operator ${operator}`)
      }

      return pipe(getPath(parts), modifier(test))
    })
  )

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
    if (!ignore || !e.toString().includes(ignore)) {
      warn(e)
    }
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

export const formatSats = sats => {
  const formatter = new Intl.NumberFormat()

  if (sats < 1_000) return formatter.format(sats)
  if (sats < 1_000_000) return formatter.format(round(1, sats / 1000)) + "K"
  if (sats < 100_000_000) return formatter.format(round(1, sats / 1_000_000)) + "MM"
  return formatter.format(round(2, sats / 100_000_000)) + "BTC"
}
