import {partition, prop, uniqBy} from "ramda"
import {batch} from "hurdak"
import {writable} from "@welshman/lib"
import type {Rumor} from "@welshman/util"
import {
  Tags,
  getIdOrAddress,
  getIdAndAddress,
  getIdFilters,
  isContextAddress,
  decodeAddress,
} from "@welshman/util"
import {Tracker} from "@welshman/net"
import type {Feed, Loader} from "@welshman/feeds"
import {FeedLoader as CoreFeedLoader, FeedType} from "@welshman/feeds"
import {LOCAL_RELAY_URL, noteKinds, reactionKinds, repostKinds} from "src/util/nostr"
import type {DisplayEvent, Event} from "src/engine"
import {
  feedLoader as baseFeedLoader,
  sortEventsDesc,
  unwrapRepost,
  isEventMuted,
  isDeleted,
  hints,
  forcePlatformRelays,
  forcePlatformRelaySelections,
  addRepostFilters,
  getFilterSelections,
  tracker,
  load,
} from "src/engine"

export type FeedOpts = {
  feed?: Feed
  anchor?: string
  skipCache?: boolean
  skipNetwork?: boolean
  skipPlatform?: boolean
  shouldDefer?: boolean
  shouldListen?: boolean
  shouldHideReplies?: boolean
  shouldLoadParents?: boolean
  includeReposts?: boolean
  onEvent?: (e: Event) => void
}

export class FeedLoader {
  done = false
  loader: Promise<Loader>
  feedLoader: CoreFeedLoader<Rumor>
  notes = writable<DisplayEvent[]>([])
  parents = new Map<string, DisplayEvent>()
  reposts = new Map<string, Event[]>()
  replies = new Map<string, Event[]>()
  isEventMuted = isEventMuted.get()
  isDeleted = isDeleted.get()

  constructor(readonly opts: FeedOpts) {
    // @ts-ignore
    window.feed = this

    // Use a custom feed loader so we can intercept the filters
    this.feedLoader = new CoreFeedLoader({
      ...baseFeedLoader.options,
      request: async ({relays, filters, onEvent}) => {
        // Default to note kinds
        filters = filters?.map(filter => ({kinds: noteKinds, ...filter})) || []

        // Add reposts if we don't have any authors specified
        if (this.opts.includeReposts && !filters.some(f => f.authors?.length > 0)) {
          filters = addRepostFilters(filters)
        }

        const promises = []
        const tracker = new Tracker()

        // Use relays specified in feeds
        if (relays?.length > 0) {
          promises.push(load({filters, relays, tracker, onEvent}))
        } else {
          if (!this.opts.skipCache) {
            promises.push(load({filters, relays: [LOCAL_RELAY_URL], tracker, onEvent}))
          }

          if (!this.opts.skipNetwork) {
            let selections = getFilterSelections(filters)

            if (!this.opts.skipPlatform) {
              selections = forcePlatformRelaySelections(selections)
            }

            for (const {relay, filters} of selections) {
              promises.push(load({filters, relays: [relay], tracker, onEvent}))
            }
          }
        }

        await Promise.all(promises)
      },
    })
  }

  // Public api

  start = (opts: Partial<FeedOpts>) => {
    Object.assign(this.opts, opts)

    this.loader = this.feedLoader.getLoader(this.opts.feed, {
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

    // Clear everything out
    this.notes.set([])
  }

  subscribe = f => this.notes.subscribe(f)

  load = (limit: number) => this.loader.then(loader => loader(limit))

  // Event selection, deferral, and parent loading

  discardEvents = async events => {
    let strict = true

    // Be more tolerant when looking at communities
    this.feedLoader.compiler.walk(this.opts.feed, ([type, key, ...feed]) => {
      if (type === FeedType.Tag && key === "#a") {
        strict = strict && !feed.some(a => isContextAddress(decodeAddress(a)))
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
      for (const k of getIdAndAddress(e)) {
        this.parents.set(k, e)
      }
    }

    const parentIds = new Set<string>()
    const notesWithParent = notes.filter(e => {
      if (repostKinds.includes(e.kind)) {
        return false
      }

      if (this.isEventMuted(e)) {
        return false
      }

      const ids = Tags.fromEvent(e).parents().values().valueOf()

      if (ids.length === 0 || ids.some(k => this.parents.has(k))) {
        return false
      }

      for (const id of ids) {
        parentIds.add(id)
      }

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
            for (const k of getIdAndAddress(e)) {
              this.parents.set(k, e)
            }
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
      const parents = Tags.fromEvent(e).parents().values().valueOf()

      return parents.length === 0 || parents.some(k => this.parents.has(k))
    }, notes)

    setTimeout(() => this.addToFeed(defer), 3000)

    return ok
  }

  // Feed building

  addToFeed = (notes: Event[]) => {
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

            // If we have a parent, show that instead, with replies grouped underneath
            while (true) {
              const parentIds = Tags.fromEvent(e).parents().values().valueOf()

              if (parentIds.length === 0) {
                break
              }

              // Keep track of replies
              for (const parentId of parentIds) {
                const replies = this.replies.get(parentId) || []
                if (!replies.some(r => r.id === e.id)) {
                  this.replies.set(parentId, [...replies, e])
                }
              }

              const parentId = parentIds.find(id => this.parents.get(id))

              if (!parentId) {
                break
              }

              e = this.parents.get(parentId)
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
