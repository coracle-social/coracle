import {bech32, utf8} from "@scure/base"
import {debounce} from "throttle-debounce"
import {mergeDeepRight, pluck} from "ramda"
import {Storage, seconds, tryFunc, sleep, isObject, round} from "hurdak"
import Fuse from "fuse.js/dist/fuse.min.js"
import {writable} from "svelte/store"
import {warn} from "src/util/logger"

export const fuzzy = (data, opts = {}) => {
  const fuse = new Fuse(data, opts)

  // Slice pattern because the docs warn that it"ll crash if too long
  return q => (q ? pluck("item", fuse.search(q.slice(0, 32))) : data)
}

export const now = () => Math.round(new Date().valueOf() / 1000)

export const getTimeZone = () => new Date().toString().match(/GMT[^\s]+/)

export const createLocalDate = dateString => new Date(`${dateString} ${getTimeZone()}`)

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

export const createScroller = (
  loadMore,
  {threshold = 2000, reverse = false, element = null} = {}
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

export const synced = (key, defaultValue = null) => {
  // If it's an object, merge defaults
  const store = writable(
    isObject(defaultValue)
      ? mergeDeepRight(defaultValue, Storage.getJson(key) || {})
      : Storage.getJson(key) || defaultValue
  )

  store.subscribe(debounce(1000, $value => Storage.setJson(key, $value)))

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

export const tryJson = f => tryFunc(f, e => e.toString().includes("JSON") || warn(e))

export const tryFetch = f => tryFunc(f, e => e.toString().includes("fetch") || warn(e))

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

export const annotateMedia = url => {
  if (url.match(/\.(jpg|jpeg|png|gif|webp)/)) {
    return {type: "image", url}
  } else if (url.match(/\.(mov|webm|mp4)/)) {
    return {type: "video", url}
  } else {
    return {type: "preview", url}
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

export const pushToKey = (xs, k, v) => {
  xs[k] = xs[k] || []
  xs[k].push(v)
}
