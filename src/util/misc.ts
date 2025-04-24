import {derived, type Readable} from "svelte/store"
import {
  now,
  stripProtocol,
  first,
  sleep,
  fromPairs,
  last,
  sum,
  identity,
  pluck,
  tryCatch,
  ensurePlural,
  MINUTE,
  HOUR,
  DAY,
  round,
  int,
} from "@welshman/lib"
import Fuse from "fuse.js"
import logger from "src/util/logger"

export const timestamp1: Readable<number> = derived([], (_, set) => {
  const interval = setInterval(() => {
    set(Math.floor(Date.now() / 1000))
  }, 1000)
  return () => clearInterval(interval)
})

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
  if (delta < MINUTE) {
    unit = "second"
  } else if (delta < HOUR) {
    unit = "minute"
    delta = Math.round(delta / MINUTE)
  } else if (delta < int(2, DAY)) {
    unit = "hour"
    delta = Math.round(delta / HOUR)
  } else {
    unit = "day"
    delta = Math.round(delta / DAY)
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

export const parseJson = (json: string) => {
  if (!json) return null

  try {
    return JSON.parse(json)
  } catch (e) {
    return null
  }
}

export const tryFetch = <T>(f: () => T) =>
  tryCatch(f, (e: Error) => {
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

export const displayUrl = url => {
  return stripProtocol(url)
    .replace(/^(www\.)?/i, "")
    .replace(/\/$/, "")
}

export const displayDomain = url => {
  return first(displayUrl(url).split(/[\/\?]/))
}

export const sumBy = (f, xs) => sum(xs.map(f))

export const ensureProto = url => (url.includes("://") ? url : "https://" + url)

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

export const fuzzy = <T>(data: T[], opts = {}): ((q: string) => any[]) => {
  const fuse = new Fuse(data, opts) as any

  // Slice pattern because the docs warn that it"ll crash if too long
  return (q: string) => {
    return q ? pluck("item", fuse.search(q.slice(0, 32)) as any[]) : data
  }
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

  getSearch = () => fuzzy<T>(this.options, this.config)

  getOption = (value: V) => this._setup()._optionsByValue.get(value)

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
