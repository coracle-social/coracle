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
  DAY,
  insertAt,
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
  getAddress,
  isShareableRelayUrl,
  getRelaysFromList,
} from "@welshman/util"
import type {TrustedEvent, Filter, List} from "@welshman/util"
import {feedFromFilters, makeRelayFeed, makeIntersectionFeed} from "@welshman/feeds"
import {load, request} from "@welshman/net"
import type {AppSyncOpts, Thunk} from "@welshman/app"
import {
  repository,
  pull,
  hasNegentropy,
  thunkQueue,
  makeFeedController,
  loadRelay,
  loadMutes,
  loadFollows,
  loadProfile,
  loadRelaySelections,
  loadInboxRelaySelections,
} from "@welshman/app"
import {createScroller} from "@lib/html"
import {daysBetween} from "@lib/util"
import {
  ALERT,
  ALERT_STATUS,
  NOTIFIER_RELAY,
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
  const controller = new AbortController()

  const markEvent = (event: TrustedEvent) => {
    if (!seen.has(event.id)) {
      seen.add(event.id)
      onEvent?.(event)
    }
  }

  const insertEvent = (event: TrustedEvent) => {
    let handled = false

    events.update($events => {
      for (let i = 0; i < $events.length; i++) {
        if ($events[i].id === event.id) return $events
        if ($events[i].created_at < event.created_at) {
          handled = true
          return insertAt(i, event, $events)
        }
      }

      return $events
    })

    if (!handled) {
      buffer.update($buffer => {
        for (let i = 0; i < $buffer.length; i++) {
          if ($buffer[i].id === event.id) return $buffer
          if ($buffer[i].created_at < event.created_at) return insertAt(i, event, $buffer)
        }

        return [...$buffer, event]
      })
    }

    markEvent(event)
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

  const ctrl = makeFeedController({
    useWindowing: true,
    feed: makeIntersectionFeed(makeRelayFeed(...relays), feedFromFilters(feedFilters)),
    onEvent: insertEvent,
    onExhausted,
  })

  for (const event of initialEvents) {
    markEvent(event)
  }

  request({
    relays,
    signal: controller.signal,
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

  const unsubscribe = thunkQueue.subscribe(onThunk)

  return {
    events,
    cleanup: () => {
      unsubscribe()
      scroller.stop()
      controller.abort()
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
  const interval = int(5, DAY)
  const controller = new AbortController()

  let exhaustedScrollers = 0
  let backwardWindow = [now() - interval, now()]
  let forwardWindow = [now(), now() + interval]

  const getStart = (event: TrustedEvent) => parseInt(getTagValue("start", event.tags) || "")

  const getEnd = (event: TrustedEvent) => parseInt(getTagValue("end", event.tags) || "")

  const events = writable(sortBy(getStart, initialEvents))

  const insertEvent = (event: TrustedEvent) => {
    const start = getStart(event)
    const address = getAddress(event)

    if (isNaN(start) || isNaN(getEnd(event))) return

    events.update($events => {
      for (let i = 0; i < $events.length; i++) {
        if ($events[i].id === event.id) return $events
        if (getStart($events[i]) > start) return insertAt(i, event, $events)
      }

      return [...$events.filter(e => getAddress(e) !== address), event]
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

  request({
    relays,
    signal: controller.signal,
    filters: subscriptionFilters,
    onEvent: (e: TrustedEvent) => {
      if (matchFilters(feedFilters, e)) insertEvent(e)
    },
  })

  const loadTimeframe = (since: number, until: number) => {
    const hashes = daysBetween(since, until).map(String)

    request({
      relays,
      signal: controller.signal,
      autoClose: true,
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

      backwardWindow = [since - interval, since]

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

      forwardWindow = [until, until + interval]

      if (until < now() + int(2, YEAR)) {
        loadTimeframe(since, until)
      } else {
        forwardScroller.stop()
        maybeExhausted()
      }
    },
  })

  const unsubscribe = thunkQueue.subscribe(onThunk)

  return {
    events,
    cleanup: () => {
      backwardScroller.stop()
      forwardScroller.stop()
      controller.abort()
      unsubscribe()
    },
  }
}

// Domain specific

export const loadAlerts = (pubkey: string) =>
  load({
    relays: [NOTIFIER_RELAY],
    filters: [{kinds: [ALERT], authors: [pubkey]}],
  })

export const loadAlertStatuses = (pubkey: string) =>
  load({
    relays: [NOTIFIER_RELAY],
    filters: [{kinds: [ALERT_STATUS], "#p": [pubkey]}],
  })

// Application requests

export const listenForNotifications = () => {
  const controller = new AbortController()

  for (const [url, allRooms] of userRoomsByUrl.get()) {
    // Limit how many rooms we load at a time, since we have to send a separate filter
    // for each one due to nip 29 breaking postel's law
    const rooms = shuffle(Array.from(allRooms)).slice(0, 30)

    load({
      signal: controller.signal,
      relays: [url],
      filters: [
        {kinds: [THREAD], limit: 1},
        {kinds: [COMMENT], "#K": [String(THREAD)], limit: 1},
        ...rooms.map(room => ({kinds: [MESSAGE], "#h": [room], limit: 1})),
      ],
    })

    request({
      signal: controller.signal,
      relays: [url],
      filters: [
        {kinds: [THREAD], since: now()},
        {kinds: [COMMENT], "#K": [String(THREAD)], since: now()},
        ...rooms.map(room => ({kinds: [MESSAGE], "#h": [room], since: now()})),
      ],
    })
  }

  return () => controller.abort()
}

export const loadUserData = async (pubkey: string, relays: string[] = []) => {
  await Promise.race([sleep(3000), loadRelaySelections(pubkey, relays)])

  const promise = Promise.race([
    sleep(3000),
    Promise.all([
      loadInboxRelaySelections(pubkey, relays),
      loadMembership(pubkey, relays),
      loadSettings(pubkey, relays),
      loadProfile(pubkey, relays),
      loadFollows(pubkey, relays),
      loadMutes(pubkey, relays),
      loadAlertStatuses(pubkey),
      loadAlerts(pubkey),
    ]),
  ])

  // Load followed profiles slowly in the background without clogging other stuff up. Only use a single
  // indexer relay to avoid too many redundant validations, which slow things down and eat bandwidth
  promise.then(async () => {
    for (const pubkeys of chunk(50, getDefaultPubkeys())) {
      const relays = sample(1, INDEXER_RELAYS)

      await sleep(1000)

      for (const pubkey of pubkeys) {
        loadMembership(pubkey, relays)
        loadProfile(pubkey, relays)
        loadFollows(pubkey, relays)
        loadMutes(pubkey, relays)
      }
    }
  })

  return promise
}

export const discoverRelays = (lists: List[]) =>
  Promise.all(
    uniq(lists.flatMap($l => getRelaysFromList($l)))
      .filter(isShareableRelayUrl)
      .map(url => loadRelay(url)),
  )
