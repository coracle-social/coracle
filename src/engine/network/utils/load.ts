import {matchFilters} from "paravel"
import {assoc, flatten, uniq, path as getPath} from "ramda"
import {defer, batch} from "hurdak"
import {pushToKey} from "src/util/misc"
import {info} from "src/util/logger"
import {getSetting} from "src/engine/session/utils"
import type {Event} from "src/engine/events/model"
import {mergeHints} from "src/engine/relays/utils"
import type {Filter} from "../model"
import {combineFilters} from "./filters"
import {subscribe} from "./subscribe"
import {Tracker} from "./tracker"

export type LoadOneOpts = {
  relays: string[]
  filters: Filter[]
}

export type LoadOpts = LoadOneOpts & {
  onEvent?: (e: Event) => void
  onEose?: (url: string) => void
  onClose?: (events: Event[]) => void
}

export type LoadItem = {
  tracker: Tracker
  request: LoadOpts
  results: ReturnType<typeof defer>[]
  result: ReturnType<typeof defer>
}

const loadChunk = (chunk, relays, tracker) => {
  const filters = combineFilters(chunk.flatMap(getPath(["request", "filters"])))
  const sub = subscribe({relays, filters, timeout: 15000})

  const chunkResults = []
  for (const item of chunk) {
    const deferred = defer() as Promise<Event[]>

    item.results.push(deferred)
    chunkResults.push({deferred, events: []})
  }

  sub.on("event", e => {
    // We have use a shared tracker in addition to the one in subscription so all urls
    // end up on the event (since we create a subscription per url). Don't filter those
    // events out though, since they may be requested by multiple load requests. Then,
    // track again per request to deduplicate.
    tracker.add(e, e.seen_on)

    chunk.forEach(({request, tracker}, i) => {
      const {events} = chunkResults[i]

      if (!tracker.add(e, e.seen_on) && matchFilters(request.filters, e)) {
        events.push(e)
        request.onEvent?.(e)
      }
    })
  })

  sub.on("eose", url => {
    chunk.forEach(({request}) => {
      request.onEose?.(url)
    })
  })

  sub.on("close", () => {
    chunk.forEach(({request}, i) => {
      const {deferred, events} = chunkResults[i]

      request.onClose?.(events)
      deferred.resolve(events)
    })
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
        pushToKey(itemsByRelay, url, item)
      }
    }

    // Group by relay, then by filter
    for (const [url, chunk] of Object.entries(itemsByRelay) as [string, LoadItem[]][]) {
      loadChunk(chunk, [url], tracker)
    }

    // Merge results from each chunk into a single result set
    for (const item of items) {
      Promise.all(item.results).then(eventChunks => item.result.resolve(flatten(eventChunks)))
    }
  }
})

export const load = (request: LoadOpts) => {
  if (request.filters.length === 0) {
    return Promise.resolve([])
  }

  const result = defer()
  const tracker = new Tracker()

  execute({tracker, request, result, results: []})

  return result
}

export const loadOne = ({relays, filters}: LoadOneOpts) =>
  new Promise(onEvent => load({relays, onEvent, filters: filters.map(assoc("limit", 1))}))
