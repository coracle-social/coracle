import {matchFilter as nostrToolsMatchFilter} from "nostr-tools"
import {omit, any, find, prop, groupBy, uniq} from "ramda"
import {shuffle, seconds, avg} from "hurdak"
import {env, pubkey} from "src/engine/session/state"
import {follows, network} from "src/engine/people/derived"
import {mergeHints, getPubkeyHints} from "src/engine/relays/utils"
import type {DynamicFilter, Filter} from "../model"

export const matchFilter = (filter, event) => {
  if (!nostrToolsMatchFilter(filter, event)) {
    return false
  }

  if (filter.search) {
    const content = event.content.toLowerCase()
    const terms = filter.search.toLowerCase().split(/\s+/g)

    return any(s => content.includes(s), terms)
  }

  return true
}

export const matchFilters = (filters, event) => any(f => matchFilter(f, event), filters)

export const calculateFilterGroup = ({limit, since, until, ...filter}: Filter) => {
  const group = Object.keys(filter)

  if (since) group.push(`since:${since}`)
  if (limit) group.push(`limit:${limit}`)
  if (until) group.push(`until:${until}`)

  return group.sort().join("-")
}

export const combineFilters = filters => {
  const result = []

  for (const group of Object.values(groupBy(calculateFilterGroup, filters))) {
    const newFilter = {}

    for (const k of Object.keys(group[0])) {
      if (["since", "until", "limit", "search"].includes(k)) {
        newFilter[k] = group[0][k]
      } else {
        newFilter[k] = uniq(group.flatMap(prop(k)))
      }
    }

    result.push(newFilter)
  }

  return result
}

export const getIdFilters = values => {
  const ids = []
  const aFilters = []

  for (const value of values) {
    if (value.includes(":")) {
      const [kind, pubkey, d] = value.split(":")

      aFilters.push({kinds: [parseInt(kind)], authors: [pubkey], "#d": [d]})
    } else {
      ids.push(value)
    }
  }

  const filters = combineFilters(aFilters)

  if (ids.length > 0) {
    filters.push({ids})
  }

  return filters
}

export const getFilterGenerality = filter => {
  if (filter.ids) {
    return 1
  }

  const hasTags = find(k => k.startsWith("#"), Object.keys(filter))

  if (filter.pubkeys && hasTags) {
    return 0.8
  }

  if (filter.pubkeys) {
    return 1 - Math.max(1, filter.pubkeys.length / 100)
  }

  return 0
}

export const guessFilterDelta = filters => {
  const avgGenerality = avg(filters.map(getFilterGenerality))

  return Math.round(seconds(7, "day") * Math.max(0.001, avgGenerality))
}

export const getPubkeysWithDefaults = (pubkeys: Set<string>) =>
  shuffle(pubkeys.size > 0 ? Array.from(pubkeys) : (env.get().DEFAULT_FOLLOWS as string[])).slice(0, 1024)

export const compileFilter = (filter: DynamicFilter): Filter => {
  if (filter.authors === "global") {
    filter = omit(["authors"], filter)
  } else if (filter.authors === "follows") {
    filter = {...filter, authors: getPubkeysWithDefaults(follows.get())}
  } else if (filter.authors === "network") {
    filter = {...filter, authors: getPubkeysWithDefaults(network.get())}
  }

  return filter as Filter
}

export const getRelaysFromFilters = filters =>
  mergeHints(
    filters.flatMap(filter =>
      filter.authors
        ? filter.authors.map(pubkey => getPubkeyHints(pubkey, "write"))
        : [getPubkeyHints(pubkey.get(), "read")]
    )
  )
