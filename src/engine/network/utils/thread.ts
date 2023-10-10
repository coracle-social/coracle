import {uniqBy, identity, prop, sortBy} from "ramda"
import {batch} from "hurdak"
import {getIds, findReplyId, findRootId} from "src/util/nostr"
import type {DisplayEvent} from "src/engine/notes/model"
import type {Event} from "src/engine/events/model"
import {writable} from "src/engine/core/utils"
import {selectHints} from "src/engine/relays/utils"
import {getIdFilters} from "./filters"
import {load} from "./load"

export class ThreadLoader {
  stopped = false
  parent = writable<DisplayEvent>(null)
  ancestors = writable<DisplayEvent[]>([])
  root = writable<DisplayEvent>(null)

  constructor(readonly note: Event, readonly relays: string[]) {
    this.loadNotes([findReplyId(note), findRootId(note)])
  }

  stop() {
    this.stopped = true
  }

  loadNotes(ids) {
    if (this.stopped) {
      return
    }

    const seen = new Set(this.getThread().flatMap(getIds))
    const filteredIds = ids.filter(id => id && !seen.has(id))

    if (filteredIds.length > 0) {
      load({
        relays: selectHints(this.relays),
        filters: getIdFilters(filteredIds),
        onEvent: batch(300, (events: Event[]) => {
          this.addToThread(events)
          this.loadNotes(events.flatMap(e => [findReplyId(e), findRootId(e)]))
        }),
      })
    }
  }

  // Thread building

  getThread() {
    const {root, ancestors, parent} = this

    return [root.get(), ...ancestors.get(), parent.get()].filter(identity)
  }

  addToThread(events) {
    const ancestors = []

    for (const event of events) {
      if (event.id === findReplyId(this.note)) {
        this.parent.set(event)
      } else if (event.id === findRootId(this.note)) {
        this.root.set(event)
      } else {
        ancestors.push(event)
      }
    }

    if (ancestors.length > 0) {
      this.ancestors.update($xs =>
        sortBy(prop("created_at"), uniqBy(prop("id"), ancestors.concat($xs)))
      )
    }
  }
}
