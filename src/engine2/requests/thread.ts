import {uniqBy, identity, prop, pluck, sortBy} from "ramda"
import {throttle, batch} from "hurdak"
import {findReplyId, findRootId} from "src/util/nostr"
import type {Event, DisplayEvent} from "src/engine2/model"
import {writable} from "src/engine2/util/store"
import {ContextLoader} from "./context"
import {load} from "./load"

export type ThreadOpts = {
  anchorId: string
  relays: string[]
}

export class ThreadLoader {
  stopped = false
  context: ContextLoader
  anchor = writable<DisplayEvent>(null)
  parent = writable<DisplayEvent>(null)
  ancestors = writable<DisplayEvent[]>([])
  root = writable<DisplayEvent>(null)

  constructor(readonly opts: ThreadOpts) {
    this.context = new ContextLoader({
      onEvent: this.updateThread,
    })

    this.loadNotes([opts.anchorId], 2)
  }

  stop() {
    this.context.stop()
  }

  loadNotes(ids, depth = 1) {
    const seen = new Set(pluck("id", this.getThread()))
    const filteredIds = ids.filter(id => id && !seen.has(id))

    if (filteredIds.length > 0) {
      load({
        relays: this.opts.relays,
        filters: [{ids: filteredIds}],
        onEvent: batch(300, (events: Event[]) => {
          this.context.addContext(events, {depth: 1})
          this.addToThread(this.context.applyContext(events))
          this.loadNotes(events.flatMap(e => [findReplyId(e), findRootId(e)]))
        }),
      })
    }
  }

  // Thread building

  getThread() {
    return [this.root.get(), ...this.ancestors.get(), this.parent.get(), this.anchor.get()].filter(
      identity
    )
  }

  addToThread(events) {
    const ancestors = []

    for (const event of events) {
      if (event.id === this.opts.anchorId) {
        this.anchor.set(event)
      } else {
        const anchor = this.anchor.get()

        if (event.id === findReplyId(anchor)) {
          this.parent.set(event)
        } else if (event.id === findRootId(anchor)) {
          this.root.set(event)
        } else {
          ancestors.push(event)
        }
      }
    }

    if (ancestors.length > 0) {
      this.ancestors.update($xs =>
        sortBy(prop("created_at"), uniqBy(prop("id"), ancestors.concat($xs)))
      )
    }
  }

  updateThread = throttle(500, () => {
    this.addToThread(this.context.applyContext(this.getThread()))
  })
}
