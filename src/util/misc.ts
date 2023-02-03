import {debounce} from 'throttle-debounce'
import {pluck, sortBy} from "ramda"
import Fuse from "fuse.js/dist/fuse.min.js"
import {writable} from 'svelte/store'
import {isObject} from 'hurdak/lib/hurdak'

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
    console.warn(`Unable to parse ${k}: ${e}`)

    return null
  }
}

export const setLocalJson = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch (e) {
    console.warn(`Unable to set ${k}: ${e}`)
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
  // NOTE TO FUTURE SELF
  // If the scroller is saturating request channels on a slow relay, the
  // loadMore function is not properly awaiting all the work necessary.
  // That is the problem, but see commit 8371fde for another strategy
  let done = false
  let timeout = null
  const check = async () => {
    // While we have empty space, fill it
    const {scrollY, innerHeight} = window
    const {scrollHeight} = document.body
    const shouldLoad = reverse
      ? scrollY < 800
      : scrollY + innerHeight + 800 > scrollHeight

    // Only trigger loading the first time we reach the threshold
    if (shouldLoad) {
      clearTimeout(timeout)

      await loadMore()
    }

    // No need to check all that often
    await sleep(300)

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
  onChunk(events) {
    this.until = events.reduce((t, e) => Math.min(t, e.created_at), this.until)
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
  const cb = debounce(t, () => f(xs.splice(0)))

  return x => {
    xs.push(x)
    cb()
  }
}
