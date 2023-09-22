import {defer} from "hurdak"
import {pushToKey} from "src/util/misc"
import {info} from "src/util/logger"
import type {Event} from "src/engine/events/model"
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

export const execute = () => {
  if (queue.length === 0) {
    return
  }

  info(
    `Loading ${queue.length} grouped requests`,
    combineFilters(queue.flatMap(item => item.request.filters))
  )

  const itemsByRelay = {}
  for (const item of queue.splice(0)) {
    for (const url of item.request.relays) {
      pushToKey(itemsByRelay, url, item)
    }
  }

  const tracker = new Tracker()

  // Group by relay, then by filter
  for (const [url, items] of Object.entries(itemsByRelay) as [string, LoadItem[]][]) {
    const filters = combineFilters(items.flatMap(item => item.request.filters))
    const sub = new Subscription({filters, relays: [url], timeout: 15000})

    sub.on("event", e => {
      const seen = tracker.add(e, url)

      if (seen) {
        return
      }

      for (const {request} of items) {
        if (request.onEvent && matchFilters(request.filters, e)) {
          request.onEvent(e)
        }
      }
    })

    sub.on("eose", url => {
      for (const {request} of items) {
        request.onEose?.(url)
      }
    })

    sub.on("close", events => {
      for (const {request} of items) {
        request.onClose?.(events)
      }
    })

    sub.result.then(events => {
      for (const item of items) {
        item.result.resolve(events)
      }
    })
  }
}

export const load = (request: LoadOpts) => {
  const result = defer()

  if (queue.length === 0) {
    setTimeout(execute, 500)
  }

  queue.push({request, result})

  return result
}
