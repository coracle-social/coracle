import {mergeRight, identity, sortBy} from "ramda"
import {first} from "hurdak"
import {now} from "src/util/misc"
import {EPOCH} from "src/util/nostr"
import {info} from "src/util/logger"
import type {Event} from "src/engine/events/model"
import type {Filter} from "../model"
import {getUrls} from "./executor"
import {guessFilterDelta} from "./filters"
import {Subscription} from "./subscribe"
import {Tracker} from "./tracker"

export type CursorOpts = {
  relay: string
  filters: Filter[]
  onEvent?: (e: Event) => void
}

export class Cursor {
  delta: number
  since: number
  buffer: Event[] = []

  until = now()
  loading = false
  done = false

  constructor(readonly opts: CursorOpts) {
    this.delta = guessFilterDelta(opts.filters)
    this.since = now() - this.delta
  }

  load(n: number) {
    const limit = n - this.buffer.length

    // If we're already loading, or we have enough buffered, do nothing
    if (this.done || this.loading || limit <= 0) {
      return null
    }

    const {since, until} = this
    const {relay, filters, onEvent} = this.opts

    this.loading = true

    let count = 0

    const sub = new Subscription({
      timeout: 5000,
      relays: [relay],
      filters: filters.map(mergeRight({until, limit, since})),
    })

    sub.on("event", (event: Event) => {
      this.until = Math.min(until, event.created_at) - 1
      this.buffer.push(event)

      count += 1

      onEvent?.(event)
    })

    sub.on("close", () => {
      this.loading = false

      // Relays can't be relied upon to return events in descending order, do exponential
      // windowing to ensure we get the most recent stuff on first load, but eventually find it all
      if (count === 0) {
        this.delta *= 10
      }

      if (this.since <= EPOCH) {
        this.done = true
      }

      this.since -= this.delta
    })

    return sub
  }

  take(n = Infinity) {
    return this.buffer.splice(0, n)
  }

  count() {
    return this.buffer.length
  }

  peek() {
    return this.buffer[0]
  }

  pop() {
    return first(this.take(1))
  }
}

export type MultiCursorOpts = {
  relays: string[]
  filters: Filter[]
  onEvent: (e: Event) => void
}

export class MultiCursor {
  bufferFactor = 4
  tracker = new Tracker()
  cursors: Cursor[]

  constructor(readonly opts: MultiCursorOpts) {
    this.cursors = getUrls(opts.relays).map(
      url =>
        new Cursor({
          relay: url,
          filters: opts.filters,
          onEvent: opts.onEvent,
        })
    )
  }

  load(limit: number) {
    const subs = this.cursors.map(c => c.load(limit)).filter(identity)

    info(`Loading ${limit} more events`, {
      filters: this.opts.filters,
      relays: subs.flatMap(sub => sub.opts.relays),
    })

    return subs
  }

  count() {
    return this.cursors.reduce((n, c) => n + c.buffer.length, 0)
  }

  take(n: number): [Subscription[], Event[]] {
    const events = []

    while (events.length < n) {
      // Find the most recent event available so that they're sorted
      const [cursor] = sortBy(
        c => -c.peek().created_at,
        this.cursors.filter(c => c.peek())
      )

      if (!cursor) {
        break
      }

      const event = cursor.pop()
      const seen = this.tracker.add(event, event.seen_on)

      if (!seen) {
        events.push(event)
      }
    }

    // Preload the next page
    const subs = this.load(n * this.bufferFactor)

    return [subs, events]
  }
}
