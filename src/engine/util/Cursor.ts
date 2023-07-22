import {all, prop, mergeLeft, identity, sortBy} from "ramda"
import {ensurePlural, first} from "hurdak"
import {now} from "src/util/misc"
import type {Filter, Event} from "src/engine/types"
import type {Subscription} from "src/engine/util/Subscription"
import type {Network} from "src/engine/components/Network"

export type CursorOpts = {
  relay: string
  filter: Filter | Filter[]
  Network: Network
  onEvent?: (e: Event) => void
}

export class Cursor {
  done: boolean
  until: number
  buffer: Event[]
  loading: boolean

  constructor(readonly opts: CursorOpts) {
    this.done = false
    this.until = now()
    this.buffer = []
    this.loading = false
  }

  load(n: number) {
    const limit = n - this.buffer.length

    // If we're already loading, or we have enough buffered, do nothing
    if (this.done || this.loading || limit <= 0) {
      return null
    }

    const {until} = this
    const {relay, filter, onEvent} = this.opts

    this.loading = true

    let count = 0

    return this.opts.Network.subscribe({
      timeout: 4000,
      relays: [relay],
      filter: ensurePlural(filter).map(mergeLeft({until, limit})),
      onEvent: (event: Event) => {
        this.until = Math.min(until, event.created_at)
        this.buffer.push(event)

        count += 1

        onEvent?.(event)
      },
      onEose: () => {
        this.loading = false
        this.done = count < limit
      },
      onClose: () => {
        this.loading = false
        this.done = true
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
  #seen_on: Map<string, string[]>
  #cursors: Cursor[]

  constructor(cursors: Cursor[]) {
    this.#seen_on = new Map()
    this.#cursors = cursors
  }

  load(limit: number) {
    return this.#cursors.map(c => c.load(limit)).filter(identity)
  }

  done() {
    return all(prop("done"), this.#cursors)
  }

  count() {
    return this.#cursors.reduce((n, c) => n + c.buffer.length, 0)
  }

  take(n: number): [Subscription[], Event[]] {
    const events = []

    while (events.length < n) {
      // Find the most recent event available so that they're sorted
      const [cursor] = sortBy(
        c => -c.peek().created_at,
        this.#cursors.filter(c => c.peek())
      )

      if (!cursor) {
        break
      }

      const event = cursor.pop()

      // Merge seen_on via mutation so it applies to future. If we've already
      // seen the event, we're also done and we don't need to add it to our buffer
      if (this.#seen_on.has(event.id)) {
        this.#seen_on.get(event.id).push(event.seen_on[0])
      } else {
        this.#seen_on.set(event.id, event.seen_on)

        events.push(event)
      }
    }

    // Preload the next page
    const subs = this.load(n)

    return [subs, events]
  }
}
