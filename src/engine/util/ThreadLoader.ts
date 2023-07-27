import {uniqBy, identity, prop, pluck, sortBy} from "ramda"
import {throttle, batch} from "hurdak"
import {findReplyId, findRootId} from "src/util/nostr"
import {PubkeyLoader} from "src/engine/util/PubkeyLoader"
import {ContextLoader} from "src/engine/util/ContextLoader"
import {writable} from "src/engine/util/store"
import type {Event, DisplayEvent} from "src/engine/types"
import type {Engine} from "src/engine/Engine"

export type ThreadOpts = {
  anchorId: string
  relays: string[]
  isMuted: (e: Event) => boolean
}

export class ThreadLoader {
  engine: Engine
  pubkeyLoader: PubkeyLoader
  stopped = false
  context: ContextLoader
  anchor = writable<DisplayEvent>(null)
  parent = writable<DisplayEvent>(null)
  ancestors = writable<DisplayEvent[]>([])
  root = writable<DisplayEvent>(null)

  constructor(engine: Engine, readonly opts: ThreadOpts) {
    this.engine = engine

    this.pubkeyLoader = new PubkeyLoader(engine)

    this.context = new ContextLoader(engine, {
      isMuted: opts.isMuted,
      onEvent: this.updateThread,
    })

    this.loadNotes([opts.anchorId], 2)
  }

  stop() {
    this.context.stop()
  }

  loadNotes(ids, depth = 1) {
    const seen = new Set(pluck('id', this.getThread()))
    const filteredIds = ids.filter(id => id && !seen.has(id))

    if (filteredIds.length > 0) {
      this.engine.Network.subscribe({
        timeout: 4000,
        relays: this.opts.relays,
        filter: {ids: filteredIds},
        onEvent: batch(300, events => {
          this.context.addContext(events, {depth: 1})
          this.addToThread(this.context.applyContext(events))
          this.loadNotes(events.flatMap(e => [findReplyId(e), findRootId(e)]))
        }),
      })
    }
  }

  // Thread building

  getThread() {
    return [
      this.root.get(),
      ...this.ancestors.get(),
      this.parent.get(),
      this.anchor.get(),
    ].filter(identity)
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
      this.ancestors.update(
        $xs => sortBy(prop('created_at'), uniqBy(prop('id'), ancestors.concat($xs)))
      )
    }
  }

  updateThread = throttle(500, () => {
    this.addToThread(this.context.applyContext(this.getThread()))
  })
}
