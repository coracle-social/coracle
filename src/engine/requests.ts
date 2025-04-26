import {debounce} from "throttle-debounce"
import {get, writable, derived} from "svelte/store"
import {Router, addMaximalFallbacks} from "@welshman/router"
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
import {deriveEvents} from "@welshman/store"
import {
  pubkey,
  repository,
  loadProfile,
  loadFollows,
  loadMutes,
  getFollows,
  pull,
  hasNegentropy,
  makeFeedController,
} from "@welshman/app"
import type {AppSyncOpts} from "@welshman/app"
import {noteKinds, reactionKinds} from "src/util/nostr"
import {CUSTOM_LIST_KINDS} from "src/domain"
import {env, myRequest, canDecrypt, myLoad, type MyRequestOptions} from "src/engine/state"

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
    const ctrl = makeFeedController({feed, onEvent, onExhausted})

    while (get(loading)) {
      await ctrl.load(100)
    }

    resolve()
  })

  return {promise, loading, stop: onExhausted}
}

export const deriveEvent = (idOrAddress: string, request: Partial<MyRequestOptions> = {}) => {
  let attempted = false

  const router = Router.get()
  const filters = getIdFilters([idOrAddress])

  return derived(
    deriveEvents(repository, {filters, includeDeleted: true}),
    (events: TrustedEvent[]) => {
      if (!attempted && events.length === 0) {
        const scenarios = [router.FromRelays(request.relays || [])]

        if (Address.isAddress(idOrAddress)) {
          scenarios.push(router.ForPubkey(Address.from(idOrAddress).pubkey))
        }

        const relays = router.merge(scenarios).policy(addMaximalFallbacks).getUrls()

        attempted = true

        myLoad({...request, skipCache: true, relays, filters})
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

        myRequest({
          autoClose: true,
          skipCache: true,
          relays: Router.get().Search().getUrls(),
          filters: [{kinds: [0], search: term, limit: 100}],
          onEvent,
          onClose: async () => {
            await sleep(Math.min(1000, Date.now() - now))

            loading.set(false)
          },
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

// Notifications

export const getNotificationKinds = () =>
  without(env.ENABLE_ZAPS ? [] : [9735], [...noteKinds, ...reactionKinds])

export const loadNotifications = () => {
  const filter = {kinds: getNotificationKinds(), "#p": [pubkey.get()]}

  return pullConservatively({
    relays: Router.get().ForUser().policy(addMaximalFallbacks).getUrls(),
    filters: [addSinceToFilter(filter, int(WEEK))],
  })
}

export const listenForNotifications = () => {
  const filter = {kinds: getNotificationKinds(), "#p": [pubkey.get()]}

  myRequest({
    skipCache: true,
    relays: Router.get().ForUser().policy(addMaximalFallbacks).getUrls(),
    filters: [addSinceToFilter(filter)],
  })
}

// Other user data

export const loadLabels = (authors: string[]) =>
  myLoad({
    skipCache: true,
    relays: Router.get().FromPubkeys(authors).policy(addMaximalFallbacks).getUrls(),
    filters: [addSinceToFilter({kinds: [LABEL], authors, "#L": ["#t"]})],
  })

export const loadDeletes = () =>
  myLoad({
    skipCache: true,
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
    filters: [addSinceToFilter({kinds: [DELETE], authors: [pubkey.get()]})],
  })

export const loadFeedsAndLists = () =>
  myLoad({
    skipCache: true,
    relays: Router.get().FromUser().policy(addMaximalFallbacks).getUrls(),
    filters: [
      addSinceToFilter({
        kinds: [FEED, FEEDS, NAMED_BOOKMARKS, ...CUSTOM_LIST_KINDS],
        authors: [pubkey.get()],
      }),
    ],
  })

export const loadMessages = () => {
  const router = Router.get()
  const scenario = router.merge([router.ForUser(), router.FromUser(), router.UserInbox()])

  if (canDecrypt.get()) {
    pullConservatively({
      relays: scenario.getUrls(),
      filters: [
        {kinds: [DEPRECATED_DIRECT_MESSAGE], authors: [pubkey.get()]},
        {kinds: [DEPRECATED_DIRECT_MESSAGE, WRAP], "#p": [pubkey.get()]},
      ],
    })
  }
}

export const listenForMessages = (pubkeys: string[]) => {
  const allPubkeys = uniq(pubkeys.concat(pubkey.get()))
  const controller = new AbortController()

  if (canDecrypt.get()) {
    myRequest({
      skipCache: true,
      signal: controller.signal,
      relays: Router.get().UserInbox().getUrls(),
      filters: [
        {kinds: [DEPRECATED_DIRECT_MESSAGE], authors: allPubkeys, "#p": allPubkeys},
        {kinds: [WRAP], "#p": [pubkey.get()]},
      ],
    })
  }

  return () => controller.abort()
}

export const loadHandlers = () =>
  myLoad({
    skipCache: true,
    relays: Router.get().ForUser().policy(addMaximalFallbacks).getUrls(),
    filters: [
      addSinceToFilter({
        kinds: [HANDLER_RECOMMENDATION],
        authors: getFollows(pubkey.get()),
      }),
      addSinceToFilter({kinds: [HANDLER_INFORMATION]}),
    ],
  })
