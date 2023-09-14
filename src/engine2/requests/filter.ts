import {omit, prop, groupBy, uniq} from "ramda"
import {shuffle} from "hurdak"
import type {DynamicFilter, Filter} from "src/engine2/model"
import {env} from "src/engine2/state"
import {follows, network} from "src/engine2/queries"

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
      if (["since", "until", "limit"].includes(k)) {
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

export const getPubkeysWithDefaults = (pubkeys: string[]) =>
  shuffle(pubkeys.length > 0 ? pubkeys : (env.get().DEFAULT_FOLLOWS as string[])).slice(0, 1024)

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
