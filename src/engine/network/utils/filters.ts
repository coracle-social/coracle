import {Address, getAddress, isContextAddress, useMaximalFallbacks, RelayMode} from "paravel"
import {omit, without, find, prop, groupBy, uniq} from "ramda"
import {shuffle, randomId, seconds, avg} from "hurdak"
import {isAddressable} from "src/util/nostr"
import {env} from "src/engine/session/state"
import {follows, network} from "src/engine/people/derived"
import {hints} from "src/engine/relays/utils"
import type {DynamicFilter, Filter} from "../model"

export const calculateFilterGroup = ({since, until, limit, search, ...filter}: Filter) => {
  const group = Object.keys(filter)

  if (since) group.push(`since:${since}`)
  if (until) group.push(`until:${until}`)
  if (limit) group.push(`limit:${randomId()}`)
  if (search) group.push(`search:${search}`)

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
      aFilters.push(Address.fromRaw(value).asFilter())
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

export const getReplyFilters = (events, filter) => {
  const a = []
  const e = []

  for (const event of events) {
    e.push(event.id)

    if (isAddressable(event)) {
      a.push(getAddress(event))
    }

    if (event.wrap) {
      e.push(event.wrap.id)
    }
  }

  const filters = []

  if (a.length > 0) {
    filters.push({...filter, "#a": a})
  }

  if (e.length > 0) {
    filters.push({...filter, "#e": e})
  }

  return filters
}

export const getFilterGenerality = filter => {
  if (filter.ids || filter["#e"] || filter["#a"]) {
    return 0
  }

  const hasTags = find(k => k.startsWith("#"), Object.keys(filter))

  if (filter.authors && hasTags) {
    return 0.2
  }

  if (filter.authors) {
    return Math.min(1, filter.authors.length / 100)
  }

  return 1
}

export const guessFilterDelta = filters => {
  const avgSpecificity = 1 - avg(filters.map(getFilterGenerality))

  return Math.round(seconds(1, "day") * Math.max(0.005, avgSpecificity))
}

export const getPubkeysWithDefaults = (pubkeys: Set<string>) => {
  if (pubkeys.size === 0) {
    pubkeys = new Set(env.get().DEFAULT_FOLLOWS)
  }

  return shuffle(Array.from(pubkeys)).slice(0, 1000)
}

export type CompileFiltersOpts = {
  includeReposts?: boolean
}

export const compileFilters = (filters: DynamicFilter[], opts: CompileFiltersOpts = {}) => {
  // Dereference authors
  filters = filters.map(filter => {
    if (filter.authors === "global") {
      filter = omit(["authors"], filter)
    } else if (filter.authors === "follows") {
      filter = {...filter, authors: getPubkeysWithDefaults(follows.get())}
    } else if (filter.authors === "network") {
      filter = {...filter, authors: getPubkeysWithDefaults(network.get())}
    }

    return filter
  })

  // Add repost filters
  if (opts.includeReposts) {
    filters = filters.flatMap(original => {
      const filterChunk = [original]

      if (!original.kinds) {
        filterChunk.push({...original, kinds: [6, 16]})
      } else {
        if (original.kinds.includes(1)) {
          filterChunk.push({...original, kinds: [6]})
        }

        const otherKinds = without([1], original.kinds)

        if (otherKinds.length > 0) {
          filterChunk.push({...original, kinds: [16], "#k": otherKinds.map(String)})
        }
      }

      return filterChunk
    })
  }

  return filters as Filter[]
}

export const getRelaysFromFilters = filters =>
  hints
    .merge({
      fallbackPolicy: useMaximalFallbacks(RelayMode.Inbox),
      scenarios: filters.flatMap(filter => {
        if (filter["#a"]?.some(isContextAddress)) {
          return filter["#a"].filter(isContextAddress).map(hints.FetchFromContext)
        }

        if (filter.authors) {
          return filter.authors.map(hints.FetchFromPubkey)
        }

        return [hints.Aggregate()]
      }),
    })
    .getUrls()
