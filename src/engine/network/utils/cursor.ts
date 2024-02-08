import {mergeLeft, pluck, min, max, identity, sortBy} from "ramda"
import {first} from "hurdak"
import type {Subscription} from "paravel"
import {now} from "paravel"
import type {Event} from "src/engine/events/model"
import {sortEventsDesc} from "src/engine/events/utils"
import type {Filter} from "../model"
import {getUrls} from "./executor"
import {guessFilterDelta} from "./filters"
import {subscribe} from "./subscribe"
import {Tracker} from "./tracker"

export type CursorOpts = {
  relay: string
  filters: Filter[]
  onEvent?: (e: Event) => void
  tracker?: Tracker
}

export class Cursor {
  delta: number
  since: number
  until: number
  minSince: number
  buffer: Event[] = []

  loading = false
  done = false

  constructor(readonly opts: CursorOpts) {
    // If we're looking for something old, don't pointlessly ask for new stuff
    const untils = pluck("until", opts.filters).filter(identity)
    const maxUntil = untils.length === opts.filters.length ? untils.reduce(max, 0) : now()

    const sinces = pluck("since", opts.filters).filter(identity)
    const minSince = sinces.length === opts.filters.length ? sinces.reduce(min, now()) : 0

    this.delta = guessFilterDelta(opts.filters)
    this.since = maxUntil - this.delta
    this.until = maxUntil
    this.minSince = minSince
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

    const onPageComplete = () => {
      this.loading = false

      // Relays can't be relied upon to return events in descending order, do exponential
      // windowing to ensure we get the most recent stuff on first load, but eventually find it all
      if (count === 0) {
        this.delta *= 10
      }

      if (this.since === this.minSince) {
        this.done = true
      } else {
        this.since = Math.max(this.minSince, this.since - this.delta)
      }
    }

    const pageFilters = filters
      // Remove filters that don't fit our window
      .filter(f => {
        const filterSince = f.since || 0
        const filterUntil = f.until || now()

        return filterSince < until && filterUntil > since
      })
      // Modify the filters to define our window
      .map(mergeLeft({until, limit, since}))

    if (pageFilters.length === 0) {
      onPageComplete()

      return null
    }

    const sub = subscribe({
      timeout: 3000,
      relays: [relay],
      skipCache: true,
      closeOnEose: true,
      tracker: this.opts.tracker,
      filters: pageFilters,
      onClose: onPageComplete,
      onEvent: (event: Event) => {
        this.until = Math.min(until, event.created_at) - 1
        this.buffer = sortEventsDesc([...this.buffer, event])

        count += 1

        onEvent?.(event)
      },
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
  onEvent?: (e: Event) => void
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
          tracker: this.tracker,
        }),
    )
  }

  load(limit: number) {
    return this.cursors.map(c => c.load(limit)).filter(identity)
  }

  done() {
    return this.cursors.every(c => c.done)
  }

  count() {
    return this.cursors.reduce((n, c) => n + c.buffer.length, 0)
  }

  take(n: number): [(typeof Subscription)[], Event[]] {
    const events = []

    while (events.length < n) {
      // Find the most recent event available so that they're sorted
      const [cursor] = sortBy(
        c => -c.peek().created_at,
        this.cursors.filter(c => c.peek()),
      )

      if (!cursor) {
        break
      }

      events.push(cursor.pop())
    }

    // Preload the next page
    const subs = this.load(n * this.bufferFactor)

    return [subs, events]
  }
}
