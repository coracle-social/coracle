import {mergeLeft, sortBy} from "ramda"
import {ensurePlural, first} from "hurdak/lib/hurdak"
import {now} from "src/util/misc"
import type {Filter, Event} from "../types"

export type CursorOpts = {
  relay: string
  filter: Filter | Filter[]
  load: (opts: any) => Promise<Event[]>
  onEvent?: (e: Event) => void
}

export class Cursor {
  until: number
  buffer: Event[]
  loading: boolean

  constructor(readonly opts: CursorOpts) {
    this.until = now()
    this.buffer = []
    this.loading = false
  }

  load(n) {
    const limit = n - this.buffer.length

    // If we're already loading, or we have enough buffered, do nothing
    if (this.loading || limit <= 0) {
      return
    }

    const {until} = this
    const {relay, filter, onEvent} = this.opts

    this.loading = true

    this.opts
      .load({
        relays: [relay],
        filter: ensurePlural(filter).map(mergeLeft({until, limit})),
        onEvent: event => {
          this.until = Math.min(until, event.created_at)
          this.buffer.push(event)

          onEvent?.(event)
        },
      })
      .then(() => {
        this.loading = false
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

  load(limit) {
    for (const cursor of this.#cursors) {
      cursor.load(limit)
    }
  }

  count() {
    return this.#cursors.reduce((n, c) => n + c.buffer.length, 0)
  }

  take(n) {
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
    this.load(n)

    return events
  }
}
