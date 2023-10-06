import {flatten, assoc, uniq, path as getPath} from "ramda"
import {defer, batch} from "hurdak"
import {pushToKey} from "src/util/misc"
import {info} from "src/util/logger"
import {getSetting} from "src/engine/session/utils"
import type {Event} from "src/engine/events/model"
import {mergeHints} from "src/engine/relays/utils"
import type {Filter} from "../model"
import {matchFilters, combineFilters} from "./filters"
import {Subscription} from "./subscribe"
import {Tracker} from "./tracker"

export type LoadOpts = {
  relays: string[]
  filters: Filter[]
  onEvent?: (e: Event) => void
  onEose?: (url: string) => void
  onClose?: (events: Event[]) => void
}

export type LoadItem = {
  request: LoadOpts
  result: ReturnType<typeof defer>
  tracker: Tracker
  chunkResult?: Promise<Event[]>
  chunkResults: Promise<Event[]>[]
}

const loadChunk = (chunk, relays, tracker) => {
  const filters = combineFilters(chunk.flatMap(getPath(["request", "filters"])))
  const sub = new Subscription({relays, filters, timeout: 15000})

  sub.on("event", e => {
    // We have use a shared tracker in addition to the one in subscription so all urls
    // end up on the event (since we create a subscription per url). Don't filter those
    // events out though, since they may be requested by multiple load requests. Then,
    // track again per request to deduplicate.
    tracker.add(e, e.seen_on)

    for (const {request, tracker} of chunk) {
      if (request.onEvent && !tracker.add(e, e.seen_on) && matchFilters(request.filters, e)) {
        request.onEvent(e)
      }
    }
  })

  sub.on("eose", url => {
    for (const {request} of chunk) {
      request.onEose?.(url)
    }
  })

  sub.on("close", events => {
    for (const {request, chunkResult} of chunk) {
      const matchingEvents = events.filter(e => matchFilters(request.filters, e))

      request.onClose?.(matchingEvents)
      chunkResult.resolve(matchingEvents)
    }
  })
}

export const execute = batch(500, (items: LoadItem[]) => {
  const filters = combineFilters(items.flatMap(item => item.request.filters))
  const relays = uniq(items.flatMap(item => item.request.relays))

  if (filters.length === 0) {
    return
  }

  info(`Loading ${items.length} grouped requests`, {filters, relays})

  const tracker = new Tracker()

  // If we're using multiplexer, let it do its thing
  if (getSetting("multiplextr_url")) {
    const relays = mergeHints(items.map(getPath(["request", "relays"])))

    loadChunk(items, relays, tracker)
  } else {
    const itemsByRelay = {}
    for (const item of items) {
      for (const url of item.request.relays) {
        const chunkResult = defer() as Promise<Event[]>

        item.chunkResults.push(chunkResult)

        pushToKey(itemsByRelay, url, {...item, chunkResult})
      }
    }

    // Group by relay, then by filter
    for (const [url, chunk] of Object.entries(itemsByRelay) as [string, LoadItem[]][]) {
      loadChunk(chunk, [url], tracker)
    }

    // Merge results from each chunk into a single result set
    for (const item of items) {
      Promise.all(item.chunkResults).then(eventGroups => item.result.resolve(flatten(eventGroups)))
    }
  }
})

export const load = (request: LoadOpts) => {
  if (request.filters.length === 0) {
    return Promise.resolve([])
  }

  const result = defer()
  const tracker = new Tracker()

  execute({request, result, tracker, chunkResults: []})

  return result
}

export const loadOne = (request: LoadOpts) => {
  return new Promise(resolve => {
    load({
      ...request,
      filters: request.filters.map(assoc("limit", 1)),
      onEvent: e => {
        request.onEvent?.(e)

        resolve(e)
      },
    })
  })
}
