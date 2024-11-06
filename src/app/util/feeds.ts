import {partition, prop, uniqBy} from "ramda"
import {batch, tryFunc, seconds} from "hurdak"
import {get, writable, derived} from "svelte/store"
import {ctx, uniq, inc, pushToMapKey, now, chunk} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {
  Tags,
  guessFilterDelta,
  getIdOrAddress,
  getIdAndAddress,
  getIdFilters,
  DIRECT_MESSAGE,
  REACTION,
  LIVE_CHAT_MESSAGE,
  getAncestorTagValues,
} from "@welshman/util"
import {Tracker} from "@welshman/net"
import type {Feed, RequestItem} from "@welshman/feeds"
import {FeedLoader as CoreFeedLoader, isIntersectionFeed, isRelayFeed} from "@welshman/feeds"
import {repository, tracker, getFilterSelections} from "@welshman/app"
import {noteKinds, isLike, reactionKinds, repostKinds} from "src/util/nostr"
import type {DisplayEvent} from "src/engine"
import {
  feedLoader as baseFeedLoader,
  sortEventsDesc,
  unwrapRepost,
  isEventMuted,
  addRepostFilters,
  load,
} from "src/engine"

export type FeedOpts = {
  feed?: Feed
  anchor?: string
  skipNetwork?: boolean
  forcePlatform?: boolean
  shouldDefer?: boolean
  shouldHideReplies?: boolean
  shouldLoadParents?: boolean
  includeReposts?: boolean
  onEvent?: (e: TrustedEvent) => void
}

const prepFilters = (filters, opts: FeedOpts) => {
  // Default to note kinds
  filters = filters?.map(filter => ({kinds: noteKinds, ...filter})) || []

  // Add reposts if we don't have any authors specified
  if (opts.includeReposts && !filters.some(f => f.authors?.length > 0)) {
    filters = addRepostFilters(filters)
  }

  return filters
}

function* getRequestItems({relays, filters}: RequestItem, opts: FeedOpts) {
  filters = prepFilters(filters, opts)

  // Use relays specified in feeds
  if (relays?.length > 0) {
    yield {filters, relays}
  } else if (!opts.skipNetwork) {
    yield* getFilterSelections(filters)
  }
}

// Use a custom feed loader so we can intercept the filters and infer relays
const createFeedLoader = (opts: FeedOpts, signal) =>
  new CoreFeedLoader({
    ...baseFeedLoader.options,
    request: async ({relays, filters, onEvent}) => {
      const tracker = new Tracker()
      const forceRelays = relays?.length > 0
      const forcePlatform = opts.forcePlatform && !forceRelays
      const requestItems = Array.from(getRequestItems({relays, filters}, opts))

      await Promise.all(
        requestItems.map(opts =>
          load({
            ...opts,
            onEvent,
            tracker,
            signal,
            skipCache: true,
            forcePlatform,
          }),
        ),
      )

      // Wait until after we've queried the network to access our local cache. This results in less
      // snappy response times, but is necessary to prevent stale stuff that the user has already seen
      // from showing up at the top of the feed
      if (!forceRelays) {
        for (const event of repository.query(prepFilters(filters, opts))) {
          onEvent(event)
        }
      }
    },
  })

export const createFeed = (opts: FeedOpts) => {
  const done = writable(false)
  const notes = writable<DisplayEvent[]>([])
  const store = derived([done, notes], ([$done, $notes]) => ({done: $done, notes: $notes}))

  const buffer: TrustedEvent[] = []
  const parents = new Map<string, DisplayEvent>()
  const reposts = new Map<string, TrustedEvent[]>()
  const $isEventMuted = isEventMuted.get()
  const controller = new AbortController()
  const welshman = createFeedLoader(opts, controller.signal)
  const useWindowing =
    !isRelayFeed(opts.feed) &&
    !(isIntersectionFeed(opts.feed) && opts.feed.length === 2 && isRelayFeed(opts.feed[1]))

  const loaderOpts = {
    useWindowing,
    onEvent: batch(300, async events => {
      if (controller.signal.aborted) {
        return
      }

      const keep = discardEvents(events)

      if (opts.shouldLoadParents) {
        loadParents(keep)
      }

      const withoutOrphans = deferOrphans(keep)
      const withoutAncient = deferAncient(withoutOrphans)

      appendToFeed(withoutAncient)
    }),
    onExhausted: () => done.set(true),
  }

  let filters, delta, loader
  Promise.resolve(tryFunc(() => welshman.compiler.compile(opts.feed))).then(async reqs => {
    filters = reqs?.flatMap(r => r.filters || [])
    delta = filters ? guessFilterDelta(filters) : seconds(24, "hour")

    loader = await (reqs
      ? welshman.getRequestsLoader(reqs, loaderOpts)
      : welshman.getLoader(opts.feed, loaderOpts))
  })

  const sortEvents = (events: TrustedEvent[]) => (useWindowing ? sortEventsDesc(events) : events)

  function deferOrphans(events: TrustedEvent[]) {
    if (!opts.shouldLoadParents || opts.shouldDefer === false) {
      return events
    }

    // If something has a parent id but we haven't found the parent yet, skip it until we have it.
    const [ok, defer] = partition(e => {
      const parentIds = Tags.fromEvent(e).parents().values().valueOf()

      return parentIds.length === 0 || parentIds.some(k => parents.has(k))
    }, events)

    if (defer.length > 0) {
      setTimeout(() => {
        if (!controller.signal.aborted) {
          appendToFeed(defer)
        }
      }, 3000)
    }

    return ok
  }

  function deferAncient(events: TrustedEvent[]) {
    if (opts.shouldDefer === false || !useWindowing) {
      return events
    }

    // Defer any really old notes until we're done loading from the network
    const feed = get(notes)
    const cutoff = feed.reduce((t, e) => Math.min(t, e.created_at), now()) - delta
    const [ok, defer] = partition(e => e.created_at > cutoff, events.concat(buffer.splice(0)))

    // Add our deferred notes back to the buffer for next time
    buffer.splice(0, Infinity, ...defer)

    // If nothing else has loaded after a delay, trickle a few new notes so the user has something to look at
    if (defer.length > 0) {
      for (let i = 0; i < defer.length; i++) {
        setTimeout(
          () => {
            if (
              buffer.length > 0 &&
              !controller.signal.aborted &&
              get(notes).length === feed.length + i
            ) {
              const [event, ...events] = sortEvents(buffer)

              buffer.splice(0, Infinity, ...events)
              appendToFeed([event])
            }
          },
          inc(i) * 400,
        )
      }
    }

    return ok
  }

  // Feed building

  function appendToFeed(events: TrustedEvent[]) {
    notes.update($events => uniqBy(prop("id"), [...$events, ...buildFeedChunk(events)]))
  }

  function buildFeedChunk(events: TrustedEvent[]) {
    const seen = new Set(get(notes).map(getIdOrAddress))
    const chunkParents = []

    // Sort first to make sure we get the latest version of replaceable events, then
    // after to make sure notes replaced by their parents are in order.
    return sortEvents(
      uniqBy(
        prop("id"),
        sortEvents(events)
          .map((e: TrustedEvent) => {
            // If we have a repost, use its contents instead
            if (repostKinds.includes(e.kind)) {
              const wrappedEvent = unwrapRepost(e)

              if (wrappedEvent) {
                pushToMapKey(reposts, wrappedEvent.id, e)
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

              const parentId = parentIds.find(id => parents.get(id))

              if (!parentId) {
                break
              }

              e = parents.get(parentId)
            }

            return e
          })
          .concat(chunkParents)
          // If we've seen this note or its parent, don't add it again
          .filter(e => {
            if (seen.has(getIdOrAddress(e))) return false
            if (repostKinds.includes(e.kind)) return false
            if (reactionKinds.includes(e.kind)) return false
            if (e.kind === LIVE_CHAT_MESSAGE && !Tags.fromEvent(e).parents().exists()) return false

            seen.add(getIdOrAddress(e))

            return true
          })
          .map((e: DisplayEvent) => {
            e.reposts = getIdAndAddress(e).flatMap(k => reposts.get(k) || [])

            return e
          }),
      ),
    )
  }

  function loadParents(events: TrustedEvent[]) {
    // Add notes to parents too since they might match
    for (const e of events) {
      for (const k of getIdAndAddress(e)) {
        parents.set(k, e)
      }
    }

    const notesWithParent = events.filter(e => {
      if (repostKinds.includes(e.kind)) {
        return false
      }

      if ($isEventMuted(e)) {
        return false
      }

      const ids = Tags.fromEvent(e).parents().values().valueOf()

      if (ids.length === 0 || ids.some(k => parents.has(k))) {
        return false
      }

      return true
    })

    for (const events of chunk(10, notesWithParent)) {
      const scenario = ctx.app.router.merge(events.map(e => ctx.app.router.EventParents(e)))

      load({
        signal: controller.signal,
        relays: scenario.getUrls(),
        filters: getIdFilters(uniq(events.flatMap(e => getAncestorTagValues(e.tags).replies))),
        onEvent: batch(100, async events => {
          if (controller.signal.aborted) {
            return
          }

          for (const e of discardEvents(events)) {
            for (const k of getIdAndAddress(e)) {
              parents.set(k, e)
            }
          }
        }),
      })
    }
  }

  function discardEvents(events) {
    return events.filter(e => {
      if (repository.isDeleted(e)) return false
      if (e.kind === REACTION && !isLike(e)) return false
      if ([4, DIRECT_MESSAGE].includes(e.kind)) return false
      if (opts.shouldHideReplies && Tags.fromEvent(e).parent()) return false
      if (getIdOrAddress(e) === opts.anchor) return false
      if ($isEventMuted(e, true)) return false

      return true
    })
  }

  return {
    getFilters: () => filters,
    stop: () => controller.abort(),
    subscribe: f => store.subscribe(f),
    loadMore: (limit: number) => loader?.(useWindowing ? limit : 1000),
  }
}
