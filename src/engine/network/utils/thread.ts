import {uniqBy, identity, prop, sortBy} from "ramda"
import {batch} from "hurdak"
import {writable} from "@welshman/lib"
import {Tags, getIdOrAddress, getIdFilters, getIdAndAddress} from "@welshman/util"
import type {DisplayEvent} from "src/engine/notes/model"
import type {Event} from "src/engine/events/model"
import {withFallbacks} from "src/engine/relays/utils"
import {load} from "./executor"

const getAncestorIds = e =>
  Tags.wrap(Object.values(Tags.fromEvent(e).ancestors()).flatMap(tags => tags.unwrap()))
    .values()
    .valueOf()

export class ThreadLoader {
  stopped = false
  parent = writable<DisplayEvent>(null)
  ancestors = writable<DisplayEvent[]>([])
  root = writable<DisplayEvent>(null)

  constructor(
    readonly note: Event,
    readonly relays: string[],
  ) {
    this.loadNotes(getAncestorIds(note))
  }

  stop() {
    this.stopped = true
  }

  loadNotes(ids) {
    if (this.stopped) {
      return
    }

    const seen = new Set(this.getThread().flatMap(getIdAndAddress))
    const filteredIds = ids.filter(id => id && !seen.has(id))

    if (filteredIds.length > 0) {
      load({
        relays: withFallbacks(this.relays),
        filters: getIdFilters(filteredIds),
        onEvent: batch(300, (events: Event[]) => {
          this.addToThread(events)
          this.loadNotes(events.flatMap(getAncestorIds))
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
    const {roots, replies} = Tags.fromEvent(this.note).ancestors()

    for (const event of events) {
      const ids = getIdOrAddress(event)

      if (replies.find(t => ids.includes(t.value()))) {
        this.parent.set(event)
      } else if (roots.find(t => ids.includes(t.value()))) {
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
