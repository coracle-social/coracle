import {always, path as getPath} from "ramda"
import {defer} from "hurdak"
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
}

const queue = []

const loadChunk = (chunk, relays, eventWasSeen = always(false)) => {
  const sub = new Subscription({
    relays,
    timeout: 15000,
    filters: combineFilters(chunk.flatMap(getPath(["request", "filters"]))),
  })

  sub.on("event", e => {
    if (eventWasSeen(e)) {
      return
    }

    for (const {request} of chunk) {
      if (request.onEvent && matchFilters(request.filters, e)) {
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
    for (const {request} of chunk) {
      request.onClose?.(events)
    }
  })

  sub.result.then(events => {
    for (const item of chunk) {
      item.result.resolve(events)
    }
  })
}

export const execute = () => {
  const filters = combineFilters(queue.flatMap(item => item.request.filters))

  if (filters.length === 0) {
    return
  }

  const items = queue.splice(0)

  info(`Loading ${items.length} grouped requests`, filters)

  // If we're using multiplexer, let it do its thing
  if (getSetting("multiplextr_url")) {
    loadChunk(items, mergeHints(items.map(getPath(["request", "relays"]))))
  } else {
    const itemsByRelay = {}
    for (const item of items) {
      for (const url of item.request.relays) {
        pushToKey(itemsByRelay, url, item)
      }
    }

    const tracker = new Tracker()

    // Group by relay, then by filter
    for (const [url, chunk] of Object.entries(itemsByRelay) as [string, LoadItem[]][]) {
      loadChunk(chunk, [url], e => tracker.add(e, url))
    }
  }
}

export const load = (request: LoadOpts) => {
  if (request.filters.length === 0) {
    return Promise.resolve([])
  }

  const result = defer()

  if (queue.length === 0) {
    setTimeout(execute, 500)
  }

  queue.push({request, result})

  return result
}
