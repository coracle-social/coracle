import {get, writable} from "svelte/store"
import {
  partition,
  chunk,
  sample,
  sleep,
  shuffle,
  uniq,
  int,
  YEAR,
  MONTH,
  insert,
  sortBy,
  assoc,
  now,
} from "@welshman/lib"
import {
  MESSAGE,
  DELETE,
  THREAD,
  EVENT_TIME,
  COMMENT,
  matchFilters,
  getTagValues,
  getTagValue,
  isShareableRelayUrl,
} from "@welshman/util"
import type {TrustedEvent, Filter, List} from "@welshman/util"
import {feedFromFilters, makeRelayFeed, makeIntersectionFeed} from "@welshman/feeds"
import type {Subscription, SubscribeRequestWithHandlers} from "@welshman/net"
import type {AppSyncOpts, Thunk} from "@welshman/app"
import {
  subscribe,
  load,
  repository,
  pull,
  hasNegentropy,
  thunkWorker,
  createFeedController,
  loadRelay,
  loadMutes,
  loadFollows,
  loadProfile,
  loadInboxRelaySelections,
  getRelayUrls,
} from "@welshman/app"
import {createScroller} from "@lib/html"
import {daysBetween} from "@lib/util"
import {
  INDEXER_RELAYS,
  getDefaultPubkeys,
  userRoomsByUrl,
  getUrlsForEvent,
  loadMembership,
  loadSettings,
} from "@app/state"

// Utils

export const pullConservatively = ({relays, filters}: AppSyncOpts) => {
  const $getUrlsForEvent = get(getUrlsForEvent)
  const [smart, dumb] = partition(hasNegentropy, relays)
  const promises = [pull({relays: smart, filters})]
  const allEvents = repository.query(filters, {shouldSort: false})

  // Since pulling from relays without negentropy is expensive, limit how many
  // duplicates we repeatedly download
  for (const url of dumb) {
    const events = allEvents.filter(e => $getUrlsForEvent(e.id).includes(url))

    if (events.length > 100) {
      filters = filters.map(assoc("since", events[10]!.created_at))
    }

    promises.push(pull({relays: [url], filters}))
  }

  return Promise.all(promises)
}

export const makeFeed = ({
  relays,
  feedFilters,
  subscriptionFilters,
  element,
  onEvent,
  onExhausted,
  initialEvents = [],
}: {
  relays: string[]
  feedFilters: Filter[]
  subscriptionFilters: Filter[]
  element: HTMLElement
  onEvent?: (event: TrustedEvent) => void
  onExhausted?: () => void
  initialEvents?: TrustedEvent[]
}) => {
  const seen = new Set<string>()
  const buffer = writable<TrustedEvent[]>([])
  const events = writable(initialEvents)

  for (const event of initialEvents) {
    if (!seen.has(event.id)) {
      seen.add(event.id)
      onEvent?.(event)
    }
  }

  const insertEvent = (event: TrustedEvent) => {
    buffer.update($buffer => {
      for (let i = 0; i < $buffer.length; i++) {
        if ($buffer[i].id === event.id) return $buffer
        if ($buffer[i].created_at < event.created_at) return insert(i, event, $buffer)
      }

      return [...$buffer, event]
    })

    if (!seen.has(event.id)) {
      seen.add(event.id)
      onEvent?.(event)
    }
  }

  const removeEvents = (ids: string[]) => {
    buffer.update($buffer => $buffer.filter(e => !ids.includes(e.id)))
    events.update($events => $events.filter(e => !ids.includes(e.id)))
  }

  const handleDelete = (e: TrustedEvent) => removeEvents(getTagValues(["e", "a"], e.tags))

  const onThunk = (thunk: Thunk) => {
    if (matchFilters(feedFilters, thunk.event)) {
      insertEvent(thunk.event)

      thunk.controller.signal.addEventListener("abort", () => {
        removeEvents([thunk.event.id])
      })
    } else if (thunk.event.kind === DELETE) {
      handleDelete(thunk.event)
    }
  }

  const ctrl = createFeedController({
    useWindowing: true,
    feed: makeIntersectionFeed(makeRelayFeed(...relays), feedFromFilters(feedFilters)),
    onEvent: insertEvent,
    onExhausted,
  })

  const sub = subscribe({
    relays,
    filters: subscriptionFilters,
    onEvent: (e: TrustedEvent) => {
      if (matchFilters(feedFilters, e)) insertEvent(e)
      if (e.kind === DELETE) handleDelete(e)
    },
  })

  const scroller = createScroller({
    element,
    delay: 300,
    threshold: 10_000,
    onScroll: async () => {
      const $buffer = get(buffer)

      events.update($events => sortBy(e => -e.created_at, [...$events, ...$buffer.splice(0, 100)]))

      if ($buffer.length < 100) {
        ctrl.load(100)
      }
    },
  })

  thunkWorker.addGlobalHandler(onThunk)

  return {
    events,
    cleanup: () => {
      sub.close()
      scroller.stop()
      thunkWorker.removeGlobalHandler(onThunk)
    },
  }
}

export const makeCalendarFeed = ({
  relays,
  feedFilters,
  subscriptionFilters,
  element,
  onExhausted,
  initialEvents = [],
}: {
  relays: string[]
  feedFilters: Filter[]
  subscriptionFilters: Filter[]
  element: HTMLElement
  onExhausted?: () => void
  initialEvents?: TrustedEvent[]
}) => {
  let exhaustedScrollers = 0
  let backwardWindow = [now() - MONTH, now()]
  let forwardWindow = [now(), now() + MONTH]

  const getStart = (event: TrustedEvent) => parseInt(getTagValue("start", event.tags) || "")

  const getEnd = (event: TrustedEvent) => parseInt(getTagValue("end", event.tags) || "")

  const events = writable(sortBy(getStart, initialEvents))

  const insertEvent = (event: TrustedEvent) => {
    const start = getStart(event)

    if (isNaN(start) || isNaN(getEnd(event))) return

    events.update($events => {
      for (let i = 0; i < $events.length; i++) {
        if ($events[i].id === event.id) return $events
        if (getStart($events[i]) > start) return insert(i, event, $events)
      }

      return [...$events, event]
    })
  }

  const removeEvents = (ids: string[]) => {
    events.update($events => $events.filter(e => !ids.includes(e.id)))
  }

  const onThunk = (thunk: Thunk) => {
    if (matchFilters(feedFilters, thunk.event)) {
      insertEvent(thunk.event)

      thunk.controller.signal.addEventListener("abort", () => {
        removeEvents([thunk.event.id])
      })
    }
  }

  const sub = subscribe({
    relays,
    filters: subscriptionFilters,
    onEvent: (e: TrustedEvent) => {
      if (matchFilters(feedFilters, e)) insertEvent(e)
    },
  })

  const loadTimeframe = (since: number, until: number) => {
    const hashes = daysBetween(since, until).map(String)

    load({
      relays,
      filters: [{kinds: [EVENT_TIME], "#D": hashes}],
      onEvent: insertEvent,
    })
  }

  const maybeExhausted = () => {
    if (++exhaustedScrollers === 2) {
      onExhausted?.()
    }
  }

  const backwardScroller = createScroller({
    element,
    reverse: true,
    onScroll: () => {
      const [since, until] = backwardWindow

      backwardWindow = [since - MONTH, since]

      if (until > now() - int(2, YEAR)) {
        loadTimeframe(since, until)
      } else {
        backwardScroller.stop()
        maybeExhausted()
      }
    },
  })

  const forwardScroller = createScroller({
    element,
    onScroll: () => {
      const [since, until] = forwardWindow

      forwardWindow = [until, until + MONTH]

      if (until < now() + int(2, YEAR)) {
        loadTimeframe(since, until)
      } else {
        forwardScroller.stop()
        maybeExhausted()
      }
    },
  })

  thunkWorker.addGlobalHandler(onThunk)

  return {
    events,
    cleanup: () => {
      thunkWorker.removeGlobalHandler(onThunk)
      backwardScroller.stop()
      forwardScroller.stop()
      sub.close()
    },
  }
}

// Application requests

export const listenForNotifications = () => {
  const subs: Subscription[] = []

  for (const [url, allRooms] of userRoomsByUrl.get()) {
    // Limit how many rooms we load at a time, since we have to send a separate filter
    // for each one due to nip 29 breaking postel's law
    const rooms = shuffle(Array.from(allRooms)).slice(0, 30)

    load({
      relays: [url],
      filters: [
        {kinds: [THREAD], limit: 1},
        {kinds: [COMMENT], "#K": [String(THREAD)], limit: 1},
        ...rooms.map(room => ({kinds: [MESSAGE], "#h": [room], limit: 1})),
      ],
    })

    subs.push(
      subscribe({
        relays: [url],
        filters: [
          {kinds: [THREAD], since: now()},
          {kinds: [COMMENT], "#K": [String(THREAD)], since: now()},
          ...rooms.map(room => ({kinds: [MESSAGE], "#h": [room], since: now()})),
        ],
      }),
    )
  }

  return () => {
    for (const sub of subs) {
      sub.close()
    }
  }
}

export const loadUserData = (
  pubkey: string,
  request: Partial<SubscribeRequestWithHandlers> = {},
) => {
  const promise = Promise.race([
    sleep(3000),
    Promise.all([
      loadInboxRelaySelections(pubkey, request),
      loadMembership(pubkey, request),
      loadSettings(pubkey, request),
      loadProfile(pubkey, request),
      loadFollows(pubkey, request),
      loadMutes(pubkey, request),
    ]),
  ])

  // Load followed profiles slowly in the background without clogging other stuff up. Only use a single
  // indexer relay to avoid too many redundant validations, which slow things down and eat bandwidth
  promise.then(async () => {
    for (const pubkeys of chunk(50, getDefaultPubkeys())) {
      const relays = sample(1, INDEXER_RELAYS)

      await sleep(1000)

      for (const pubkey of pubkeys) {
        loadMembership(pubkey, {relays})
        loadProfile(pubkey, {relays})
        loadFollows(pubkey, {relays})
        loadMutes(pubkey, {relays})
      }
    }
  })

  return promise
}

export const discoverRelays = (lists: List[]) =>
  Promise.all(uniq(lists.flatMap(getRelayUrls)).filter(isShareableRelayUrl).map(loadRelay))
