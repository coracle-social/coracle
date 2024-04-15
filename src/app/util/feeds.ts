import {partition, prop, uniqBy} from "ramda"
import {batch} from "hurdak"
import {writable} from "@coracle.social/lib"
import {
  Tags,
  getIdOrAddress,
  getIdAndAddress,
  getIdFilters,
  isContextAddress,
  decodeAddress,
} from "@coracle.social/util"
import type {Feed, Loader} from "@coracle.social/feeds"
import {FeedLoader as CoreFeedLoader, FeedType, Scope} from "@coracle.social/feeds"
import {generatePrivateKey} from "src/util/nostr"
import {LOCAL_RELAY_URL, reactionKinds, repostKinds} from "src/util/nostr"
import type {DisplayEvent, Event} from "src/engine"
import {
  sortEventsDesc,
  unwrapRepost,
  isEventMuted,
  isDeleted,
  primeWotCaches,
  hints,
  forcePlatformRelays,
  forcePlatformRelaySelections,
  addRepostFilters,
  getFilterSelections,
  tracker,
  load,
  dvmRequest,
  getFollowedPubkeys,
  getFollowers,
  maxWot,
  people,
  getWotScore,
  user,
} from "src/engine"

const requestDvm = async ({kind, tags = [], onEvent}) => {
  const sk = generatePrivateKey()
  const event = await dvmRequest({kind, tags, sk, timeout: 3000})

  if (event) {
    onEvent(event)
  }
}

const request = async ({relays, filters, onEvent}) => {
  if (relays.length > 0) {
    await load({filters, relays, onEvent})
  } else {
    await Promise.all(
      getFilterSelections(filters).map(({relay, filters}) =>
        load({filters, relays: [relay], onEvent}),
      ),
    )
  }
}

const getPubkeysForScope = (scope: string) => {
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
}

const getPubkeysForWotRange = (min, max) => {
  const pubkeys = []
  const $user = user.get()
  const thresholdMin = maxWot.get() * min
  const thresholdMax = maxWot.get() * max

  primeWotCaches($user.pubkey)

  for (const person of people.get()) {
    const score = getWotScore($user.pubkey, person.pubkey)

    if (score >= thresholdMin && score <= thresholdMax) {
      pubkeys.push(person.pubkey)
    }
  }

  return pubkeys
}

export const feedLoader = new CoreFeedLoader({
  request,
  requestDvm,
  getPubkeysForScope,
  getPubkeysForWotRange,
})

export type FeedOpts = {
  feed?: Feed
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
  onEvent?: (e: Event) => void
}

export class FeedLoader {
  done = false
  loader: Promise<Loader>
  notes = writable<DisplayEvent[]>([])
  buffer = writable<DisplayEvent[]>([])
  parents = new Map<string, DisplayEvent>()
  reposts = new Map<string, Event[]>()
  replies = new Map<string, Event[]>()
  isEventMuted = isEventMuted.get()
  isDeleted = isDeleted.get()

  constructor(readonly opts: FeedOpts) {}

  // Public api

  start = (opts: Partial<FeedOpts>) => {
    Object.assign(this.opts, opts)

    // Use a custom feed loader so we can intercept the filters
    const feedLoader = new CoreFeedLoader({
      requestDvm,
      getPubkeysForScope,
      getPubkeysForWotRange,
      request: async ({relays, filters, onEvent}) => {
        if (this.opts.includeReposts && !filters.some(f => f.authors?.length > 0)) {
          filters = addRepostFilters(filters)
        }

        const promises = []

        if (relays.length > 0) {
          promises.push(load({filters, relays, onEvent}))
        } else {
          if (!this.opts.skipCache) {
            promises.push(load({filters, relays: [LOCAL_RELAY_URL], onEvent}))
          }

          if (!this.opts.skipNetwork) {
            let selections = getFilterSelections(filters)

            if (!this.opts.skipPlatform) {
              selections = forcePlatformRelaySelections(selections)
            }

            for (const {relay, filters} of selections) {
              promises.push(load({filters, relays: [relay], onEvent}))
            }
          }
        }

        await Promise.all(promises)
      },
    })

    this.loader = feedLoader.getLoader(this.opts.feed, {
      onEvent: batch(300, async events => {
        const keep = await this.discardEvents(events)

        if (this.opts.shouldLoadParents) {
          this.loadParents(keep)
        }

        const ok = this.deferOrphans(keep)

        this.addToFeed(ok)
      }),
      onExhausted: () => {
        this.done = true
      },
    })

    // Rebuild the feed based on our buffer
    this.notes.set(this.buildFeedChunk(this.buffer.get()))
  }

  subscribe = f => this.notes.subscribe(f)

  load = (limit: number) => this.loader.then(loader => loader(limit))

  // Event selection, deferral, and parent loading

  discardEvents = async events => {
    let strict = false

    // Be more tolerant when looking at communities
    feedLoader.compiler.walk(this.opts.feed, ([type, ...feed]) => {
      if (type === FeedType.Filter) {
        strict = feed.some(f => f["#a"]?.find(a => isContextAddress(decodeAddress(a))))
      }
    })

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

    const selections = hints.merge(notesWithParent.map(hints.EventParents)).getSelections()

    for (const {relay, values} of selections) {
      load({
        filters: getIdFilters(values),
        relays: this.opts.skipPlatform ? [relay] : forcePlatformRelays([relay]),
        onEvent: batch(100, async events => {
          for (const e of await this.discardEvents(events)) {
            this.parents.set(e.id, e)
          }
        }),
      })
    }
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

  // Feed building

  addToFeed = (notes: Event[]) => {
    this.buffer.update($buffer => uniqBy(prop("id"), $buffer.concat(notes)))
    this.notes.update($notes => uniqBy(prop("id"), [...$notes, ...this.buildFeedChunk(notes)]))
  }

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

            // Only replace parents for kind 1 replies or reactions
            if (!reactionKinds.concat(1).includes(e.kind)) {
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
}
