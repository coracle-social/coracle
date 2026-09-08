import {first, sleep, fromPairs, last, identity, pluck, round, displayUrl} from "@welshman/lib"
import {createSearch} from "@welshman/app"
import type {Search, SearchOptions} from "@welshman/app"
import {readable} from "svelte/store"
import Fuse from "fuse.js"

export const ticker = () => {
  let seconds = 0

  return readable(seconds, set => {
    const interval = setInterval(() => set(++seconds), 1000)

    return () => clearInterval(interval)
  })
}

export const formatDateAsLocalISODate = (date: Date) => {
  const offset = date.getTimezoneOffset() * 60000
  const datetime = new Date(date.getTime() - offset).toISOString()

  return datetime
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
  element = element.closest(".scroll-container") || element

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

export const numberFmt = new Intl.NumberFormat()

export const formatSats = (sats: number) => {
  if (sats < 1_000) return numberFmt.format(sats)
  if (sats < 1_000_000) return numberFmt.format(round(1, sats / 1000)) + "K"
  if (sats < 100_000_000) return numberFmt.format(round(1, sats / 1_000_000)) + "MM"
  return numberFmt.format(round(2, sats / 100_000_000)) + "BTC"
}

const toSnake = (x: string) =>
  x
    .replace(/[-_ ]+/g, "_")
    .replace(/([^_])_*([A-Z][a-z]+)/g, "$1_$2")
    .replace(/\.([A-Z])/g, "_$1")
    .toLowerCase()

export const toTitle = (x: string) =>
  toSnake(x)
    .split("_")
    .map(([a, ...w]) => [(a || "").toUpperCase(), ...w].join(""))
    .join(" ")

export const commaFormat = (x: string | number) =>
  String(x)
    .split("")
    .reverse()
    .reduce((acc, n, i) => n + (i && !(i % 3) ? "," : "") + acc)
    .replace("-,", "-")

export const pluralize = (n: number, label: string, pluralLabel?: string) =>
  n === 1 ? label : pluralLabel || `${label}s`

export const quantify = (n: number, label: string, pluralLabel?: string) =>
  `${commaFormat(n)} ${pluralize(n, label, pluralLabel)}`

// Not @welshman/lib's displayDomain, which splits before stripping the protocol and so answers
// "https:" for any url carrying a scheme.
export const displayDomain = url => {
  return first(displayUrl(url).split(/[\/\?]/))
}

export const ensureProto = url => (url.includes("://") ? url : "https://" + url)

export const buildQueryString = params => "?" + new URLSearchParams(params)

export const parseQueryString = path =>
  fromPairs(Array.from(new URLSearchParams(last(path.split("?")))))

export const updateIn =
  <T>(k: string, f: (x: T) => T) =>
  x => ({...x, [k]: f(x[k])})

export const pickVals = <T>(ks: string[], x: Record<string, T>) => ks.map(k => x[k])

export const fuzzy = <T>(data: T[], opts = {}): ((q: string) => any[]) => {
  const fuse = new Fuse(data, opts) as any

  // Slice pattern because the docs warn that it"ll crash if too long
  return (q: string) => {
    return q ? pluck("item", fuse.search(q.slice(0, 32)) as any[]) : data
  }
}

export type MakeSearchOptions<V, T> = SearchOptions<V, T> & {
  displayValue: (value: V, option?: T) => string
}

export type LocalSearch<V, T> = Search<V, T> & {
  displayValue: (value: V) => string
  displayOption: (option: T) => string
}

// welshman's createSearch, plus the display helpers our select components expect. `displayValue`
// gets the matching option along with the value, since most of ours only render the option.
export const makeSearch = <V, T>(
  options: T[],
  {displayValue, ...opts}: MakeSearchOptions<V, T>,
): LocalSearch<V, T> => {
  const search = createSearch<V, T>(options, opts)

  return {
    ...search,
    displayValue: (value: V) => displayValue(value, search.getOption(value)),
    displayOption: (option: T) => displayValue(search.getValue(option), option),
  }
}

export const fromCsv = s => (s || "").split(",").filter(identity)

export const toSpliced = <T>(xs: T[], start: number, deleteCount: number = 0, ...items: T[]) => [
  ...xs.slice(0, start),
  ...items,
  ...xs.slice(start + deleteCount),
]

export const ensureMailto = (value: string) =>
  !value.includes(":") && value.includes("@") ? "mailto:" + value : value

// Tracking query params that leak user activity to ad networks.
// Derived from https://github.com/mpchadwick/tracking-query-params-registry
const TRACKING_PARAMS = new Set([
  "_hsenc",
  "_hsmi",
  "ck_subscriber_id",
  "dclid",
  "fbclid",
  "gbraid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "mkt_tok",
  "msclkid",
  "oly_anon_id",
  "oly_enc_id",
  "rb_clickid",
  "ref",
  "ref_src",
  "ref_url",
  "sc_customer",
  "sc_uid",
  "spm",
  "twclid",
  "ttclid",
  "vero_conv",
  "vero_id",
  "wbraid",
  "yclid",
])

export const stripTrackers = (url: string) => {
  try {
    const parsed = new URL(url)

    for (const key of [...parsed.searchParams.keys()]) {
      if (TRACKING_PARAMS.has(key.toLowerCase()) || key.toLowerCase().startsWith("utm_")) {
        parsed.searchParams.delete(key)
      }
    }

    return parsed.toString()
  } catch {
    return url
  }
}
