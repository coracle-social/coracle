import {partition, prop, uniqBy, without, assoc} from "ramda"
import {batch} from "hurdak"
import {now, writable} from "@coracle.social/lib"
import {
  Tags,
  getIdOrAddress,
  getIdAndAddress,
  getIdFilters,
  guessFilterDelta,
} from "@coracle.social/util"
import {race} from "src/util/misc"
import {info} from "src/util/logger"
import {LOCAL_RELAY_URL, reactionKinds, repostKinds} from "src/util/nostr"
import type {DisplayEvent} from "src/engine/notes/model"
import type {Event} from "src/engine/events/model"
import {sortEventsDesc, unwrapRepost} from "src/engine/events/utils"
import {isEventMuted, isDeleted} from "src/engine/events/derived"
import {hints, forcePlatformRelaySelections, forceRelaySelections} from "src/engine/relays/utils"
import type {DynamicFilter} from "src/engine/network/utils"
import {compileFilters, addRepostFilters, getFilterSelections} from "src/engine/network/utils"
import {tracker, load, subscribe} from "./executor"
import {MultiCursor} from "./cursor"

export type FeedOpts = {
  relays: string[]
  filters: DynamicFilter[]
  onEvent?: (e: Event) => void
  anchor?: string
  skipCache?: boolean
  skipNetwork?: boolean
  skipPlatform?: boolean
  shouldDefer?: boolean
  shouldListen?: boolean
  shouldBuffer?: boolean
  shouldHideReplies?: boolean
  shouldLoadParents?: boolean
  includeReposts?: boolean
}

export class FeedLoader {
  stopped = false
  subs: Array<{close: () => void}> = []
  buffer = writable<Event[]>([])
  notes = writable<DisplayEvent[]>([])
  parents = new Map<string, DisplayEvent>()
  reposts = new Map<string, Event[]>()
  replies = new Map<string, Event[]>()
  cursor: MultiCursor
  ready: Promise<void>
  isEventMuted = isEventMuted.get()
  isDeleted = isDeleted.get()

  constructor(readonly opts: FeedOpts) {
    let filters = compileFilters(opts.filters)

    if (opts.includeReposts && !opts.filters.some(f => f.authors?.length > 0)) {
      filters = addRepostFilters(filters)
    }

    console.log(filters)

    let relaySelections = []

    if (!opts.skipNetwork) {
      relaySelections = getFilterSelections(filters)
      relaySelections = forceRelaySelections(relaySelections, opts.relays)

      if (!opts.skipPlatform) {
        relaySelections = forcePlatformRelaySelections(relaySelections)
      }
    }

    if (!opts.skipCache) {
      relaySelections.push({relay: LOCAL_RELAY_URL, filters})
    }

    // No point in subscribing if we have an end date
    if (opts.shouldListen && !opts.filters.every(prop("until"))) {
      this.addSubs(
        relaySelections.map(({relay, filters}) =>
          subscribe({
            relays: [relay],
            skipCache: true,
            filters: filters.map(assoc("since", now())),
            onEvent: batch(300, (events: Event[]) => {
              events = this.discardEvents(events)

              if (opts.shouldLoadParents) {
                this.loadParents(events)
              }

              if (opts.shouldBuffer) {
                this.buffer.update($buffer => $buffer.concat(events))
              } else {
                this.addToFeed(events, {prepend: true})
              }
            }),
          }),
        ),
      )
    }

    this.cursor = new MultiCursor({
      relaySelections,
      onEvent: batch(300, events => {
        if (opts.shouldLoadParents) {
          this.loadParents(this.discardEvents(events))
        }
      }),
    })

    const subs = this.addSubs(this.cursor.load(50))

    // Wait until at least one subscription has completed to reduce the chance of
    // out of order notes
    if (subs.length === 1) {
      this.ready = Promise.resolve()
    } else {
      this.ready = race(
        Math.min(2, subs.length),
        subs.map(
          s =>
            new Promise(r => {
              s.emitter.on("event", r)
              s.emitter.on("complete", r)
            }),
        ),
      )
    }
  }

  discardEvents(events) {
    // Be more tolerant when looking at communities
    const strict = this.opts.filters.some(f => f["#a"])

    return events.filter(e => {
      if (this.isDeleted(e)) {
        return false
      }

      if (this.isEventMuted(e, strict)) {
        return false
      }

      if (this.opts.shouldHideReplies && Tags.fromEvent(e).parent()) {
        return false
      }

      if (getIdOrAddress(e) === this.opts.anchor) {
        return false
      }

      return true
    })
  }

  loadParents = notes => {
    // Add notes to parents too since they might match
    for (const e of notes) {
      this.parents.set(e.id, e)
    }

    const parentIds = new Set<string>()
    const notesWithParent = notes.filter(e => {
      if (repostKinds.includes(e.kind)) {
        return false
      }

      if (this.isEventMuted(e)) {
        return false
      }

      const parentId = Tags.fromEvent(e).parent()?.value()

      if (!parentId) {
        return false
      }

      parentIds.add(parentId)

      return true
    })

    if (parentIds.size === 0) {
      return
    }

    const scenario =
      this.opts.relays.length > 0
        ? hints.product(Array.from(parentIds), this.opts.relays)
        : hints.merge(notesWithParent.map(hints.EventParents))

    for (const {relay, values} of scenario.getSelections()) {
      load({
        relays: [relay],
        filters: getIdFilters(values),
        onEvent: batch(100, events => {
          for (const e of this.discardEvents(events)) {
            this.parents.set(e.id, e)
          }
        }),
      })
    }
  }

  // Control

  addSubs(subs) {
    for (const sub of subs) {
      this.subs.push(sub)

      sub.emitter.on("complete", () => {
        this.subs = without([sub], this.subs)
      })
    }

    return subs
  }

  stop() {
    this.stopped = true

    for (const sub of this.subs) {
      sub.close()
    }
  }

  // Feed building

  buildFeedChunk = (notes: Event[]) => {
    const seen = new Set(this.notes.get().map(getIdOrAddress))
    const parents = []

    // Sort first to make sure we get the latest version of replaceable events, then
    // after to make sure notes replaced by their parents are in order.
    return sortEventsDesc(
      uniqBy(
        prop("id"),
        sortEventsDesc(notes)
          .map((e: Event) => {
            // If we have a repost, use its contents instead
            if (repostKinds.includes(e.kind)) {
              const wrappedEvent = unwrapRepost(e)

              if (wrappedEvent) {
                const reposts = this.reposts.get(wrappedEvent.id) || []

                this.reposts.set(wrappedEvent.id, [...reposts, e])

                tracker.copy(e.id, wrappedEvent.id)

                e = wrappedEvent
              }
            }

            // Only replace parents for kind 1 replies
            if (e.kind !== 1) {
              return e
            }

            // If we have a parent, show that instead, with replies grouped underneath
            while (true) {
              const parentId = Tags.fromEvent(e).parent()?.value()

              if (!parentId) {
                break
              }

              // Keep track of replies
              const replies = this.replies.get(parentId) || []
              if (!replies.some(r => r.id === e.id)) {
                this.replies.set(parentId, [...replies, e])
              }

              const parent = this.parents.get(parentId)

              if (!parent) {
                break
              }

              e = parent
            }

            return e
          })
          .concat(parents)
          // If we've seen this note or its parent, don't add it again
          .filter(e => {
            if (seen.has(getIdOrAddress(e))) return false
            if (repostKinds.includes(e.kind)) return false
            if (reactionKinds.includes(e.kind)) return false

            seen.add(getIdOrAddress(e))

            return true
          })
          .map((e: DisplayEvent) => {
            e.replies = getIdAndAddress(e).flatMap(k => this.replies.get(k) || [])
            e.reposts = getIdAndAddress(e).flatMap(k => this.reposts.get(k) || [])

            return e
          }),
      ),
    )
  }

  addToFeed = (notes: Event[], {prepend = false} = {}) => {
    this.notes.update($notes => {
      const chunk = this.buildFeedChunk(notes)
      const combined = prepend ? [...chunk, ...$notes] : [...$notes, ...chunk]

      return uniqBy(prop("id"), combined)
    })
  }

  subscribe = f => this.notes.subscribe(f)

  // Loading

  async load(n) {
    await this.ready

    if (this.cursor.done()) {
      return
    }

    info(`Loading ${n} more events`, {
      filters: this.opts.filters,
      relays: this.opts.relays,
    })

    const [subs, events] = this.cursor.take(n)

    this.addSubs(subs)
    this.addToFeed(this.deferOrphans(this.discardEvents(events)))
  }

  loadBuffer() {
    this.buffer.update($buffer => {
      this.addToFeed($buffer)

      return []
    })
  }

  deferOrphans = (notes: Event[]) => {
    if (!this.opts.shouldLoadParents || this.opts.shouldDefer === false) {
      return notes
    }

    // If something has a parent id but we haven't found the parent yet, skip it until we have it.
    const [ok, defer] = partition(e => {
      const parent = Tags.fromEvent(e).parent()

      return !parent || this.parents.has(parent.value())
    }, notes)

    setTimeout(() => this.addToFeed(defer), 3000)

    return ok
  }

  deferAncient = (notes: Event[]) => {
    if (this.opts.shouldDefer === false) {
      return notes
    }

    // Sometimes relays send very old data very quickly. Pop these off the queue and re-add
    // them after we have more timely data. They still might be relevant, but order will still
    // be maintained since everything before the cutoff will be deferred the same way.
    const since = now() - guessFilterDelta(this.opts.filters)
    const [ok, defer] = partition(e => e.created_at > since, notes)

    setTimeout(() => this.addToFeed(defer), 5000)

    return ok
  }
}
