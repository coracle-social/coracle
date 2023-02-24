import {debounce, throttle} from 'throttle-debounce'
import {aperture, path as getPath, allPass, pipe, isNil, complement, equals, is, pluck, sum, identity, sortBy} from "ramda"
import Fuse from "fuse.js/dist/fuse.min.js"
import {writable} from 'svelte/store'
import {isObject} from 'hurdak/lib/hurdak'
import {warn} from 'src/util/logger'

export const fuzzy = (data, opts = {}) => {
  const fuse = new Fuse(data, opts)

  // Slice pattern because the docs warn that it"ll crash if too long
  return q => (q ? pluck("item", fuse.search(q.slice(0, 32))) : data)
}

export const hash = s =>
  Math.abs(s.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0))

export const getLocalJson = (k) => {
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

export const timedelta = (n, unit = 'seconds') => {
  switch (unit) {
    case 'seconds': case 'second': return n
    case 'minutes': case 'minute': return n * 60
    case 'hours': case 'hour': return n * 60 * 60
    case 'days': case 'day': return n * 60 * 60 * 24
    default: throw new Error(`Invalid unit ${unit}`)
  }
}

export const formatTimestamp = ts => {
  const formatter = new Intl.DateTimeFormat('en-US', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })

  return formatter.format(new Date(ts * 1000))
}

export const formatTimestampRelative = ts => {
  let unit
  let delta = now() - ts
  if (delta < timedelta(1, 'minute')) {
    unit = 'second'
  } else if (delta < timedelta(1, 'hour')) {
    unit = 'minute'
    delta = Math.round(delta / timedelta(1, 'minute'))
  } else if (delta < timedelta(2, 'day')) {
    unit = 'hour'
    delta = Math.round(delta / timedelta(1, 'hour'))
  } else {
    unit = 'day'
    delta = Math.round(delta / timedelta(1, 'day'))
  }

  const formatter = new Intl.RelativeTimeFormat('en-US', {
    numeric: 'auto',
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

export const getLastSync = (k, fallback = 0) => {
  const key = `${k}/lastSync`
  const lastSync = getLocalJson(key) || fallback

  setLocalJson(key, now())

  return lastSync
}

export class Cursor {
  until: number
  limit: number
  constructor(limit = 10) {
    this.until = now()
    this.limit = limit
  }
  update(events) {
    // update takes all events in a feed and figures out the best place to set `until`
    // in order to find older events without re-fetching events that we've already seen.
    // There are various edge cases:
    // - When we have zero events, there's nothing we can do, presumably we have everything.
    // - Sometimes relays send us extremely old events. Use median to avoid too-large gaps
    if (events.length > 1) {
      const timestamps = sortBy(identity, pluck('created_at', events))
      const gaps = aperture(2, timestamps).map(([a, b]) => b - a)
      const gap = quantile(gaps, 0.5)

      this.until -= Math.round(gap * events.length)
    }
  }
}

export const synced = (key, defaultValue = null) => {
  // If it's an object, merge defaults
  const store = writable(
    isObject(defaultValue)
      ? {...defaultValue, ...getLocalJson(key)}
      : (getLocalJson(key) || defaultValue)
  )

  store.subscribe(debounce(1000, $value => setLocalJson(key, $value)))

  return store
}

export const shuffle = sortBy(() => Math.random()  > 0.5)

export const batch = (t, f) => {
  const xs = []
  const cb = throttle(t, () => f(xs.splice(0)))

  return x => {
    xs.push(x)
    cb()
  }
}

export const defer = () => {
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
    Object.entries(filters)
      .map(([key, value]) => {
        /* eslint prefer-const: 0 */
        let [field, operator = 'eq'] = key.split(':')
        let test, modifier = identity, parts = field.split('.')

        if (operator.startsWith('!')) {
          operator = operator.slice(1)
          modifier = complement
        }

        if (operator === 'eq' && is(Array, value)) {
          test = v => (value as Array<any>).includes(v)
        } else if (operator === 'eq') {
          test = equals(value)
        } else if (operator === 'lt') {
          test = v => (v || 0) < value
        } else if (operator === 'lte') {
          test = v => (v || 0) <= value
        } else if (operator === 'gt') {
          test = v => (v || 0) > value
        } else if (operator === 'gte') {
          test = v => (v || 0) >= value
        } else if (operator === 'nil') {
          test = isNil
        } else {
          throw new Error(`Invalid operator ${operator}`)
        }

        return pipe(getPath(parts), modifier(test))
      })
  )

// https://stackoverflow.com/a/21682946
//
export const stringToColor = (value, saturation = 100, lightness = 50) => {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = value.charCodeAt(i) + ((hash << 5) - hash)
    hash = hash & hash
  }

  return `hsl(${(hash % 360)}, ${saturation}%, ${lightness}%)`;
}

export const tryJson = f => {
  try {
    return f()
  } catch (e) {
    if (!e.toString().includes('JSON')) {
      warn(e)
    }
  }
}

export const union = (...sets) =>
  new Set(sets.flatMap(s => Array.from(s)))

export const difference = (a, b) =>
  new Set(Array.from(a).filter(x => !b.has(x)))

export const quantile = (a, q) => {
    const sorted = sortBy(identity, a)
    const pos = (sorted.length - 1) * q
    const base = Math.floor(pos)
    const rest = pos - base

    return isNil(sorted[base + 1])
      ? sorted[base]
      : sorted[base] + rest * (sorted[base + 1] - sorted[base])
}
