import {partition, prop, uniqBy, identity, without, any, assoc} from "ramda"
import {ensurePlural, doPipe, batch} from "hurdak"
import {now, hasValidSignature, Tags} from "paravel"
import {race, tryJson} from "src/util/misc"
import {info} from "src/util/logger"
import {
  LOCAL_RELAY_URL,
  getIdOrAddress,
  getIdAndAddress,
  noteKinds,
  reactionKinds,
  repostKinds,
  getParentId,
} from "src/util/nostr"
import type {DisplayEvent} from "src/engine/notes/model"
import type {Event} from "src/engine/events/model"
import {sortEventsDesc} from "src/engine/events/utils"
import {isEventMuted, isDeleted} from "src/engine/events/derived"
import {writable} from "src/engine/core/utils"
import type {Filter} from "../model"
import {getIdFilters, guessFilterDelta} from "./filters"
import {getUrls} from "./executor"
import {subscribe} from "./subscribe"
import {MultiCursor} from "./cursor"
import {load} from "./load"

export type FeedOpts = {
  relays: string[]
  filters: Filter[]
  onEvent?: (e: Event) => void
  anchor?: string
  shouldDefer?: boolean
  shouldListen?: boolean
  shouldBuffer?: boolean
  shouldHideReplies?: boolean
  shouldLoadParents?: boolean
}

export class FeedLoader {
  since = now()
  stopped = false
  subs: Array<{close: () => void}> = []
  buffer = writable<Event[]>([])
  notes = writable<DisplayEvent[]>([])
  parents = new Map<string, DisplayEvent>()
  reposts = new Map<string, Event[]>()
  replies = new Map<string, Event[]>()
  deferred: Event[] = []
  remoteCursor: MultiCursor
  localCursor: MultiCursor
  ready: Promise<void>
  isEventMuted = isEventMuted.get()
  isDeleted = isDeleted.get()

  constructor(readonly opts: FeedOpts) {
    const urls = getUrls(opts.relays)

    // No point in subscribing if we have an end date
    if (opts.shouldListen && !any(prop("until"), ensurePlural(opts.filters) as any[])) {
      this.addSubs([
        subscribe({
          relays: urls,
          filters: opts.filters.map(assoc("since", this.since)),
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
      ])
    }

    this.remoteCursor = new MultiCursor({
      relays: opts.relays,
      filters: opts.filters,
      onEvent: batch(100, events => {
        if (opts.shouldLoadParents) {
          this.loadParents(this.discardEvents(events))
        }
      }),
    })

    this.localCursor = new MultiCursor({
      relays: [LOCAL_RELAY_URL],
      filters: opts.filters,
      onEvent: batch(100, events => {
        if (opts.shouldLoadParents) {
          this.loadParents(this.discardEvents(events))
        }
      }),
    })

    const remoteSubs = this.remoteCursor.load(50)
    const localSubs = this.localCursor.load(50)

    this.addSubs(remoteSubs)
    this.addSubs(localSubs)

    // Wait until a good number of subscriptions have completed to reduce the chance of
    // out of order notes
    this.ready = race(
      0.4,
      remoteSubs.map(s => new Promise(r => s.on("close", r))),
    )
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

      if (this.opts.shouldHideReplies && getParentId(e)) {
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

    const parentIds = notes
      .filter(e => !repostKinds.includes(e.kind) && !this.isEventMuted(e))
      .map(e => getParentId(e))
      .filter(identity)

    load({
      relays: this.opts.relays,
      filters: getIdFilters(parentIds),
      onEvent: batch(100, events => {
        for (const e of this.discardEvents(events)) {
          this.parents.set(e.id, e)
        }
      }),
    })
  }

  // Control

  addSubs(subs) {
    for (const sub of ensurePlural(subs)) {
      this.subs.push(sub)

      sub.on("close", () => {
        this.subs = without([sub], this.subs)
      })
    }
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
              const wrappedEvent = tryJson(() => JSON.parse(e.content))

              if (wrappedEvent && hasValidSignature(wrappedEvent)) {
                const originalGroup = Tags.from(wrappedEvent).circles().first()
                const repostGroup = Tags.from(e).circles().first()

                // Only show cross-posts, not reposts from global to global
                if (originalGroup !== repostGroup) {
                  const reposts = this.reposts.get(wrappedEvent.id) || []

                  this.reposts.set(wrappedEvent.id, [...reposts, e])

                  e = {...wrappedEvent, seen_on: e.seen_on}
                }
              }
            }

            // Keep track of replies
            if (noteKinds.includes(e.kind)) {
              const parentId = getParentId(e)
              const replies = this.replies.get(parentId) || []

              this.replies.set(parentId, [...replies, e])
            }

            // If we have a parent, show that instead, with replies grouped underneath
            while (true) {
              const parentId = getParentId(e)

              if (!parentId) {
                break
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

    if (this.remoteCursor.done()) {
      return
    }

    info(`Loading ${n} more events`, {
      filters: this.opts.filters,
      relays: this.opts.relays,
    })

    const [subs, events] = this.remoteCursor.take(n)

    this.addSubs(subs)

    let ok = this.discardEvents(events)

    // Skip anything out of order or missing context
    if (this.opts.shouldDefer) {
      ok = doPipe(ok.concat(this.deferred.splice(0)), [this.deferOrphans, this.deferAncient])
    }

    // If we have nothing load something from the cache to keep the user happy
    if (ok.length === 0) {
      const [subs, events] = this.localCursor.take(1)

      this.addSubs(subs)

      ok = this.discardEvents(events)
    }

    this.addToFeed(ok)
  }

  loadBuffer() {
    this.buffer.update($buffer => {
      this.addToFeed($buffer)

      return []
    })
  }

  deferOrphans = (notes: Event[]) => {
    if (!this.opts.shouldLoadParents) {
      return notes
    }

    // If something has a parent id but we haven't found the parent yet, skip it until we have it.
    const [defer, ok] = partition(e => {
      const parentId = getParentId(e)

      return parentId && !this.parents.get(parentId)
    }, notes)

    setTimeout(() => this.addToFeed(defer), 1500)

    return ok
  }

  deferAncient = (notes: Event[]) => {
    // Sometimes relays send very old data very quickly. Pop these off the queue and re-add
    // them after we have more timely data. They still might be relevant, but order will still
    // be maintained since everything before the cutoff will be deferred the same way.
    const since = now() - guessFilterDelta(this.opts.filters)
    const [defer, ok] = partition(e => e.created_at < since, notes)

    setTimeout(() => this.addToFeed(defer), 4000)

    return ok
  }
}
