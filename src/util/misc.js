import {Buffer} from 'buffer'
import {bech32} from 'bech32'
import {pluck} from "ramda"
import Fuse from "fuse.js/dist/fuse.min.js"

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
    return null
  }
}

export const setLocalJson = (k, v) => {
  try {
    localStorage.setItem(k, JSON.stringify(v))
  } catch (e) {
    // pass
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

  return formatter.format(-delta, unit)
}

export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms))

export const createScroller = loadMore => {
  let done = false
  let didLoad = false
  let timeout = null
  const check = async () => {
    // While we have empty space, fill it
    const {scrollY, innerHeight} = window
    const {scrollHeight} = document.body
    const shouldLoad = scrollY + innerHeight + 800 > scrollHeight

    // Only trigger loading the first time we reach the threshhold
    if (shouldLoad && !didLoad) {
      clearTimeout(timeout)

      await loadMore()

      // If nothing loads, the page doesn't reflow and we get stuck.
      // Give it a generous timeout from last time something did load
      timeout = setTimeout(() => {
        didLoad = false
      }, 2000)
    }

    didLoad = shouldLoad

    // No need to check all that often
    await sleep(300)

    if (!done) {
      requestAnimationFrame(check)
    }

  }

  requestAnimationFrame(check)

  return {
    check: () => {
      didLoad = false
      check()
    },
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
  constructor(delta) {
    this.since = now()
    this.until = now()
    this.delta = delta
  }
  step() {
    this.until = this.since
    this.since -= this.delta

    return [this.since, this.until]
  }
}


export const hexToBech32 = (prefix, hex) =>
  bech32.encode(prefix, bech32.toWords(Buffer.from(hex, 'hex')))

export const bech32ToHex = b32 =>
  Buffer.from(bech32.fromWords(bech32.decode(b32).words)).toString('hex')

