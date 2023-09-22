import {uniqBy, identity, prop, pluck, sortBy} from "ramda"
import {batch} from "hurdak"
import {findReplyId, findRootId} from "src/util/nostr"
import type {DisplayEvent} from "src/engine/notes/model"
import type {Event} from "src/engine/events/model"
import {writable} from "src/engine/core/utils"
import {load} from "./load"

export type ThreadOpts = {
  anchorId: string
  relays: string[]
}

export class ThreadLoader {
  stopped = false
  anchor = writable<DisplayEvent>(null)
  parent = writable<DisplayEvent>(null)
  ancestors = writable<DisplayEvent[]>([])
  root = writable<DisplayEvent>(null)

  constructor(readonly opts: ThreadOpts) {
    this.loadNotes([opts.anchorId])
  }

  stop() {
    this.stopped = true
  }

  loadNotes(ids) {
    if (this.stopped) {
      return
    }

    const seen = new Set(pluck("id", this.getThread()))
    const filteredIds = ids.filter(id => id && !seen.has(id))

    if (filteredIds.length > 0) {
      load({
        relays: this.opts.relays,
        filters: [{ids: filteredIds}],
        onEvent: batch(300, (events: Event[]) => {
          this.addToThread(events)
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
}
