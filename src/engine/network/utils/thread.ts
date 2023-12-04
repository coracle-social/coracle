import {uniqBy, identity, prop, sortBy} from "ramda"
import {batch} from "hurdak"
import {Tags} from "paravel"
import type {DisplayEvent} from "src/engine/notes/model"
import type {Event} from "src/engine/events/model"
import {writable} from "src/engine/core/utils"
import {selectHints} from "src/engine/relays/utils"
import {getIds} from "src/engine/events/utils"
import {getIdFilters} from "./filters"
import {load} from "./load"

export class ThreadLoader {
  stopped = false
  parent = writable<DisplayEvent>(null)
  ancestors = writable<DisplayEvent[]>([])
  root = writable<DisplayEvent>(null)

  constructor(
    readonly note: Event,
    readonly relays: string[],
  ) {
    this.loadNotes(Tags.from(note).type(["e", "a"]).values().all())
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
          this.loadNotes(events.flatMap(e => Tags.from(e).type(["e", "a"]).values().all()))
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
    const tags = Tags.from(this.note)
    const ancestors = []

    for (const event of events) {
      if (event.id === tags.getReply("e")) {
        this.parent.set(event)
      } else if (event.id === tags.getRoot("e")) {
        this.root.set(event)
      } else {
        ancestors.push(event)
      }
    }

    if (ancestors.length > 0) {
      this.ancestors.update($xs =>
        sortBy(prop("created_at"), uniqBy(prop("id"), ancestors.concat($xs))),
      )
    }
  }
}
