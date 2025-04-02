import {debounce} from "throttle-debounce"
import {get, writable, derived} from "svelte/store"
import type {RequestOpts, Feed} from "@welshman/feeds"
import {FeedController} from "@welshman/feeds"
import {
  uniq,
  without,
  partition,
  assoc,
  always,
  chunk,
  max,
  int,
  HOUR,
  WEEK,
  sortBy,
  noop,
  sleep,
} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {
  getIdFilters,
  WRAP,
  EPOCH,
  LABEL,
  DELETE,
  FEED,
  NAMED_BOOKMARKS,
  HANDLER_INFORMATION,
  HANDLER_RECOMMENDATION,
  DEPRECATED_DIRECT_MESSAGE,
  FEEDS,
  Address,
} from "@welshman/util"
import {Tracker, RequestEvent} from "@welshman/net"
import {deriveEvents} from "@welshman/store"
import {
  pubkey,
  repository,
  loadProfile,
  loadFollows,
  loadMutes,
  getFilterSelections,
  getFollows,
  pull,
  hasNegentropy,
  requestDVM,
  getPubkeysForScope,
  getPubkeysForWOTRange,
  Router,
} from "@welshman/app"
import type {AppSyncOpts} from "@welshman/app"
import {noteKinds, reactionKinds} from "src/util/nostr"
import {race} from "src/util/misc"
import {CUSTOM_LIST_KINDS} from "src/domain"
import {env, myRequest, myLoad, type MyRequestOptions} from "src/engine/state"

// Utils

export const addSinceToFilter = (filter, overlap = int(HOUR)) => {
  const limit = 50
  const events = repository.query([{...filter, limit}])

  // If we only have a few events, it won't hurt to re-fetch everything. This can happen when
  // we fetch notifications with a limit of 1, giving us just a handful of events without pulling
  // the full dataset.
  const since =
    events.length < limit ? EPOCH : max(events.map(e => e.created_at).concat(EPOCH)) - overlap

  return {...filter, since}
}

export const pullConservatively = ({relays, filters}: AppSyncOpts) => {
  const [smart, dumb] = partition(hasNegentropy, relays)
  const promises = [pull({relays: smart, filters})]

  // Since pulling from relays without negentropy is expensive, limit how many
  // duplicates we repeatedly download
  if (dumb.length > 0) {
    const events = sortBy(e => -e.created_at, repository.query(filters))

    if (events.length > 100) {
      filters = filters.map(assoc("since", events[100]!.created_at))
    }

    promises.push(pull({relays: dumb, filters}))
  }

  return Promise.all(promises)
}

export const loadAll = (feed, {onEvent}: {onEvent: (e: TrustedEvent) => void}) => {
  const loading = writable(true)

  const onExhausted = () => loading.set(false)

  const promise = new Promise<void>(async resolve => {
    const ctrl = createFeedController({feed, onEvent, onExhausted})

    while (get(loading)) {
      await ctrl.load(100)
    }

    resolve()
  })

  return {promise, loading, stop: onExhausted}
}

export const deriveEvent = (idOrAddress: string, request: Partial<MyRequestOptions> = {}) => {
  let attempted = false

  const filters = getIdFilters([idOrAddress])

  return derived(
    deriveEvents(repository, {filters, includeDeleted: true}),
    (events: TrustedEvent[]) => {
      if (!attempted && events.length === 0) {
        let relays = Router.get().Search().getUrls()

        if (request.relays) {
          relays = request.relays
        } else if (Address.isAddress(idOrAddress)) {
          const a = Address.from(idOrAddress)

          relays = uniq([...a.relays, ...Router.get().ForPubkey(a.pubkey).getUrls()])
        }

        attempted = true

        myLoad({
          ...request,
          skipCache: true,
          forcePlatform: false,
          relays,
          filters: getIdFilters([idOrAddress]),
        })
      }

      return events[0]
    },
  )
}

// People

type PeopleLoaderOpts = {
  shouldLoad?: (term: string) => boolean
  onEvent?: (e: TrustedEvent) => void
}

export const createPeopleLoader = ({
  shouldLoad = always(true),
  onEvent = noop,
}: PeopleLoaderOpts = {}) => {
  const loading = writable(false)

  return {
    loading,
    load: debounce(500, term => {
      if (term.length > 2 && shouldLoad(term)) {
        const now = Date.now()

        loading.set(true)

        const req = myRequest({
          autoClose: true,
          skipCache: true,
          forcePlatform: false,
          relays: Router.get().Search().getUrls(),
          filters: [{kinds: [0], search: term, limit: 100}],
        })

        req.on(RequestEvent.Event, onEvent)

        req.on(RequestEvent.Close, async () => {
          await sleep(Math.min(1000, Date.now() - now))

          loading.set(false)
        })
      }
    }),
  }
}

export const loadPubkeys = async (pubkeys: string[]) => {
  // Load slowly to avoid congestion and messing up relay selections for profiles.
  for (const pubkeyChunk of chunk(50, pubkeys)) {
    await sleep(300)

    for (const pubkey of pubkeyChunk) {
      loadProfile(pubkey)
      loadFollows(pubkey)
      loadMutes(pubkey)
    }
  }
}

// Feeds

export type FeedRequestHandlerOptions = {forcePlatform: boolean; signal: AbortSignal}

export const makeFeedRequestHandler =
  ({forcePlatform, signal}: FeedRequestHandlerOptions) =>
  async ({relays, filters, onEvent}: RequestOpts) => {
    const tracker = new Tracker()
    const loadOptions = {
      onEvent,
      tracker,
      signal,
      forcePlatform,
      skipCache: true,
      autoClose: true,
      delay: 0,
    }

    if (relays?.length > 0) {
      await new Promise(resolve => {
        const req = myRequest({...loadOptions, relays, filters})

        req.on(RequestEvent.Event, onEvent)
        req.on(RequestEvent.Close, resolve)
      })
    } else {
      // Break out selections by relay so we can complete early after a certain number
      // of requests complete for faster load times
      await race(
        filters.every(f => f.search) ? 0.1 : 0.8,
        getFilterSelections(filters).flatMap(
          ({relays, filters}) =>
            new Promise(resolve => {
              const req = myRequest({...loadOptions, relays, filters})

              req.on(RequestEvent.Event, onEvent)
              req.on(RequestEvent.Close, resolve)
            }),
        ),
      )

      // Wait until after we've queried the network to access our local cache. This results in less
      // snappy response times, but is necessary to prevent stale stuff that the user has already seen
      // from showing up at the top of the feed
      for (const event of repository.query(filters)) {
        onEvent(event)
      }
    }
  }

export type FeedControllerOptions = {
  feed: Feed
  onEvent: (event: TrustedEvent) => void
  onExhausted: () => void
  forcePlatform?: boolean
  useWindowing?: boolean
  signal?: AbortSignal
}

export const createFeedController = ({forcePlatform = true, ...options}: FeedControllerOptions) => {
  const request = makeFeedRequestHandler({forcePlatform, signal: options.signal})
  return new FeedController({
    request,
    requestDVM,
    getPubkeysForScope,
    getPubkeysForWOTRange,
    ...options,
  })
}

// Notifications

export const getNotificationKinds = () =>
  without(env.ENABLE_ZAPS ? [] : [9735], [...noteKinds, ...reactionKinds])

export const loadNotifications = () => {
  const filter = {kinds: getNotificationKinds(), "#p": [pubkey.get()]}

  return pullConservatively({
    relays: Router.get().ForUser().getUrls(),
    filters: [addSinceToFilter(filter, int(WEEK))],
  })
}

export const listenForNotifications = () => {
  const filter = {kinds: getNotificationKinds(), "#p": [pubkey.get()]}

  myRequest({
    skipCache: true,
    relays: Router.get().ForUser().getUrls(),
    filters: [addSinceToFilter(filter)],
  })
}

// Other user data

export const loadLabels = (authors: string[]) =>
  myLoad({
    skipCache: true,
    forcePlatform: false,
    relays: Router.get().FromPubkeys(authors).getUrls(),
    filters: [addSinceToFilter({kinds: [LABEL], authors, "#L": ["#t"]})],
  })

export const loadDeletes = () =>
  myLoad({
    skipCache: true,
    forcePlatform: false,
    relays: Router.get().FromUser().getUrls(),
    filters: [addSinceToFilter({kinds: [DELETE], authors: [pubkey.get()]})],
  })

export const loadFeedsAndLists = () =>
  myLoad({
    skipCache: true,
    forcePlatform: false,
    relays: Router.get().FromUser().getUrls(),
    filters: [
      addSinceToFilter({
        kinds: [FEED, FEEDS, NAMED_BOOKMARKS, ...CUSTOM_LIST_KINDS],
        authors: [pubkey.get()],
      }),
    ],
  })

export const loadMessages = () =>
  pullConservatively({
    // TODO, stop using non-inbox relays
    relays: Router.get()
      .merge([Router.get().ForUser(), Router.get().FromUser(), Router.get().UserInbox()])
      .getUrls(),
    filters: [
      {kinds: [DEPRECATED_DIRECT_MESSAGE], authors: [pubkey.get()]},
      {kinds: [DEPRECATED_DIRECT_MESSAGE, WRAP], "#p": [pubkey.get()]},
    ],
  })

export const listenForMessages = (pubkeys: string[]) => {
  const allPubkeys = uniq(pubkeys.concat(pubkey.get()))

  return myRequest({
    skipCache: true,
    forcePlatform: false,
    relays: Router.get().UserInbox().getUrls(),
    filters: [
      {kinds: [DEPRECATED_DIRECT_MESSAGE], authors: allPubkeys, "#p": allPubkeys},
      {kinds: [WRAP], "#p": [pubkey.get()]},
    ],
  })
}

export const loadHandlers = () =>
  myLoad({
    skipCache: true,
    forcePlatform: false,
    relays: Router.get().ForUser().getUrls().concat("wss://relay.nostr.band/"),
    filters: [
      addSinceToFilter({
        kinds: [HANDLER_RECOMMENDATION],
        authors: getFollows(pubkey.get()),
      }),
      addSinceToFilter({kinds: [HANDLER_INFORMATION]}),
    ],
  })
