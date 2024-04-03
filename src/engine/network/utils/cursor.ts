import {mergeLeft, pluck, min, max, identity, sortBy} from "ramda"
import {first, sleep} from "hurdak"
import {now, writable} from "@coracle.social/lib"
import type {Filter} from "@coracle.social/util"
import {guessFilterDelta} from "@coracle.social/util"
import type {Subscription} from "@coracle.social/network"
import type {Event} from "src/engine/events/model"
import {sortEventsDesc} from "src/engine/events/utils"
import type {RelayFilters} from "src/engine/network/utils"
import {subscribe, LOAD_OPTS} from "./executor"

export type CursorOpts = {
  relay: string
  filters: Filter[]
  onEvent?: (e: Event) => void
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
      ...LOAD_OPTS,
      relays: [relay],
      immediate: true,
      skipCache: true,
      filters: pageFilters,
      onComplete: onPageComplete,
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
  relaySelections: RelayFilters[]
  onEvent?: (e: Event) => void
}

export class MultiCursor {
  bufferFactor = 4
  cursors: Cursor[]

  constructor(readonly opts: MultiCursorOpts) {
    this.cursors = opts.relaySelections.map(
      ({relay, filters}) => new Cursor({relay, filters, onEvent: opts.onEvent}),
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

  take(n: number): [Subscription[], Event[]] {
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

  loadAll = ({onComplete = null} = {}) => {
    const loading = writable(true)
    const stop = () => {
      loading.set(false)
      onComplete?.()
    }

    setTimeout(async () => {
      while (loading.get()) {
        this.take(250)

        await sleep(2000)

        if (this.done()) {
          stop()
        }
      }
    })

    return {stop, loading}
  }
}
