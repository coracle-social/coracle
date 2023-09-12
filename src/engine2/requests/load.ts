import {matchFilters} from "nostr-tools"
import {prop, groupBy, uniq} from "ramda"
import {batch} from "hurdak"
import {subscribe} from "./subscription"
import type {Event, Filter} from "src/engine2/model"

export type LoadOpts = {
  relays: string[]
  filters: Filter[]
  onEvent?: (e: Event) => void
  onEose?: (url: string) => void
  onClose?: (events: Event[]) => void
}

export const calculateGroup = ({since, until, ...filter}: Filter) => {
  const group = Object.keys(filter)

  if (since) {
    group.push(`since:${since}`)
  }

  if (until) {
    group.push(`until:${until}`)
  }

  return group.sort().join("-")
}

export const combineFilters = filters => {
  const result = []

  for (const group of Object.values(groupBy(calculateGroup, filters))) {
    const newFilter = {}

    for (const k of Object.keys(group[0])) {
      newFilter[k] = uniq(group.flatMap(prop(k)))
    }

    result.push(newFilter)
  }

  return result
}

export const load = batch(500, (requests: LoadOpts[]) => {
  const relays = uniq(requests.flatMap(prop("relays")))
  const filters = combineFilters(requests.flatMap(prop("filters")))

  const sub = subscribe({relays, filters, timeout: 3000})

  sub.on("event", (e: Event) => {
    for (const req of requests) {
      if (!req.onEvent) {
        continue
      }

      if (matchFilters(req.filters, e)) {
        req.onEvent(e)
      }
    }
  })

  sub.on("eose", url => {
    for (const req of requests) {
      req.onEose?.(url)
    }
  })

  sub.on("close", events => {
    for (const req of requests) {
      req.onClose?.(events)
    }
  })

  return sub
})
