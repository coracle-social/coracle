import {mergeRight, identity, sortBy} from "ramda"
import {seconds, first} from "hurdak"
import {now} from "src/util/misc"
import {EPOCH} from "src/util/nostr"
import type {Filter, Event} from "src/engine2/model"
import type {Subscription} from "./subscription"
import {subscribe} from "./subscription"

export type CursorOpts = {
  relay: string
  filters: Filter[]
  onEvent?: (e: Event) => void
}

export class Cursor {
  until = now()
  delta = seconds(10, "minute")
  since = now() - this.delta
  buffer: Event[] = []
  loading = false
  done = false

  constructor(readonly opts: CursorOpts) {}

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

    return subscribe({
      timeout: 5000,
      relays: [relay],
      filters: filters.map(mergeRight({until, limit, since})),
      onEvent: (event: Event) => {
        this.until = Math.min(until, event.created_at) - 1
        this.buffer.push(event)

        count += 1

        onEvent?.(event)
      },
      onClose: () => {
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
      },
    })
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

export class MultiCursor {
  bufferFactor = 4
  seen_on: Map<string, string[]>
  cursors: Cursor[]

  constructor(cursors: Cursor[]) {
    this.seen_on = new Map()
    this.cursors = cursors
  }

  load(limit: number) {
    return this.cursors.map(c => c.load(limit)).filter(identity)
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

      // Merge seen_on via mutation so it applies to future. If we've already
      // seen the event, we're also done and we don't need to add it to our buffer
      if (this.seen_on.has(event.id) && !this.seen_on.get(event.id).includes(event.seen_on[0])) {
        this.seen_on.get(event.id).push(event.seen_on[0])
      } else {
        this.seen_on.set(event.id, event.seen_on)

        events.push(event)
      }
    }

    // Preload the next page
    const subs = this.load(n * this.bufferFactor)

    return [subs, events]
  }
}
