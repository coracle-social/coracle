import {partition, prop, uniqBy, without, assoc} from "ramda"
import {batch} from "hurdak"
import {now, writable} from "@coracle.social/lib"
import type {Filter} from "@coracle.social/util"
import {
  Tags,
  getIdOrAddress,
  getIdAndAddress,
  getIdFilters,
  guessFilterDelta,
} from "@coracle.social/util"
import type {Feed} from "@coracle.social/feeds"
import {FeedCompiler, Scope} from "@coracle.social/feeds"
import {race} from "src/util/misc"
import {generatePrivateKey} from "src/util/nostr"
import {info} from "src/util/logger"
import {LOCAL_RELAY_URL, reactionKinds, repostKinds} from "src/util/nostr"
import type {DisplayEvent, Event} from "src/engine"
import {
  sortEventsDesc,
  unwrapRepost,
  isEventMuted,
  isDeleted,
  hints,
  forcePlatformRelaySelections,
  forceRelaySelections,
  addRepostFilters,
  getFilterSelections,
  tracker,
  load,
  subscribe,
  MultiCursor,
  dvmRequest,
  getFollowedPubkeys,
  getFollowers,
  maxWot,
  people,
  getWotScore,
  user,
} from "src/engine"

export const feedCompiler = new FeedCompiler({
  requestDvm: async ({request, onEvent}) => {
    const event = await dvmRequest({
      ...request,
      timeout: 3000,
      sk: generatePrivateKey(),
    })

    if (event) {
      onEvent(event)
    }
  },
  request: async ({relays, filters, onEvent}) => {
    if (relays.length > 0) {
      await load({filters, relays, onEvent})
    } else {
      await Promise.all(
        getFilterSelections(filters).map(({relay, filters}) =>
          load({filters, relays: [relay], onEvent}),
        ),
      )
    }
  },
  getPubkeysForScope: (scope: string) => {
    const $user = user.get()

    switch (scope) {
      case Scope.Self:
        return $user ? [$user.pubkey] : []
      case Scope.Follows:
        return getFollowedPubkeys($user)
      case Scope.Followers:
        return Array.from(getFollowers($user.pubkey).map(p => p.pubkey))
      default:
        throw new Error(`Invalid scope ${scope}`)
    }
  },
  getPubkeysForWotRange: (min, max) => {
    const pubkeys = []
    const $user = user.get()
    const thresholdMin = maxWot.get() * min
    const thresholdMax = maxWot.get() * max

    for (const person of people.get()) {
      const score = getWotScore($user.pubkey, person.pubkey)

      if (score >= thresholdMin && score <= thresholdMax) {
        pubkeys.push(person.pubkey)
      }
    }

    return pubkeys
  },
})

export type FeedOpts = {
  feed: Feed
  relays: string[]
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
  config: Promise<{filters: Filter[]}>
  subs: Array<{close: () => void}> = []
  buffer = writable<Event[]>([])
  notes = writable<DisplayEvent[]>([])
  parents = new Map<string, DisplayEvent>()
  reposts = new Map<string, Event[]>()
  replies = new Map<string, Event[]>()
  cursor: MultiCursor
  isEventMuted = isEventMuted.get()
  isDeleted = isDeleted.get()

  constructor(readonly opts: FeedOpts) {
    this.config = this.start()
  }

  async start() {
    const requestItem = await feedCompiler.compile(this.opts.feed)
    const filters =
      this.opts.includeReposts && !requestItem.filters.some(f => f.authors?.length > 0)
        ? addRepostFilters(requestItem.filters)
        : requestItem.filters

    let relaySelections = []

    if (requestItem.relays.length > 0) {
      relaySelections = requestItem.relays.map(relay => ({relay, filters}))
    } else if (!this.opts.skipNetwork) {
      relaySelections = getFilterSelections(filters)
      relaySelections = forceRelaySelections(relaySelections, this.opts.relays)

      if (!this.opts.skipPlatform) {
        relaySelections = forcePlatformRelaySelections(relaySelections)
      }
    }

    if (!this.opts.skipCache && requestItem.relays.length === 0) {
      relaySelections.push({relay: LOCAL_RELAY_URL, filters})
    }

    // No point in subscribing if we have an end date
    if (this.opts.shouldListen && !filters.every(prop("until"))) {
      this.addSubs(
        relaySelections.map(({relay, filters}) =>
          subscribe({
            relays: [relay],
            skipCache: true,
            filters: filters.map(assoc("since", now())),
            onEvent: batch(300, async (events: Event[]) => {
              events = await this.discardEvents(events)

              if (this.opts.shouldLoadParents) {
                this.loadParents(events)
              }

              if (this.opts.shouldBuffer) {
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
      onEvent: batch(300, async events => {
        if (this.opts.shouldLoadParents) {
          this.loadParents(await this.discardEvents(events))
        }
      }),
    })

    const subs = this.addSubs(this.cursor.load(50))

    // Wait until at least one subscription has completed to reduce the chance of
    // out of order notes
    if (subs.length > 1) {
      await race(
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

    return {filters}
  }

  async discardEvents(events) {
    // Be more tolerant when looking at communities
    const {filters} = await this.config
    const strict = filters.some(f => f["#a"])

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
        onEvent: batch(100, async events => {
          for (const e of await this.discardEvents(events)) {
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
    await this.config

    if (this.cursor.done()) {
      return
    }

    const [subs, events] = this.cursor.take(n)

    this.addSubs(subs)
    this.addToFeed(this.deferOrphans(await this.discardEvents(events)))
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

  deferAncient = async (notes: Event[]) => {
    const {filters} = await this.config

    if (this.opts.shouldDefer === false) {
      return notes
    }

    // Sometimes relays send very old data very quickly. Pop these off the queue and re-add
    // them after we have more timely data. They still might be relevant, but order will still
    // be maintained since everything before the cutoff will be deferred the same way.
    const since = now() - guessFilterDelta(filters)
    const [ok, defer] = partition(e => e.created_at > since, notes)

    setTimeout(() => this.addToFeed(defer), 5000)

    return ok
  }
}
