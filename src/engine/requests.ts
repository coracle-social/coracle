import {debounce} from "throttle-debounce"
import {get, writable, derived} from "svelte/store"
import {noop, sleep, switcherFn} from "hurdak"
import type {LoadOpts} from "@welshman/feeds"
import {FeedLoader, Scope} from "@welshman/feeds"
import {
  ctx,
  assoc,
  always,
  chunk,
  nthEq,
  nth,
  now,
  max,
  first,
  int,
  HOUR,
  WEEK,
  sortBy,
} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {
  Address,
  getIdFilters,
  isGroupAddress,
  createEvent,
  WRAP,
  EPOCH,
  LABEL,
  DELETE,
  FEED,
  SEEN_CONVERSATION,
  SEEN_GENERAL,
  SEEN_CONTEXT,
  NAMED_BOOKMARKS,
  HANDLER_INFORMATION,
  HANDLER_RECOMMENDATION,
  DEPRECATED_DIRECT_MESSAGE,
  FEEDS,
} from "@welshman/util"
import {deriveEvents} from "@welshman/store"
import {makeDvmRequest} from "@welshman/dvm"
import {
  pubkey,
  repository,
  signer,
  loadProfile,
  loadFollows,
  loadMutes,
  getFilterSelections,
  getFollowers,
  getFollows,
  pull,
  hasNegentropy,
  wotGraph,
  maxWot,
  getNetwork,
} from "@welshman/app"
import type {AppSyncOpts} from "@welshman/app"
import {noteKinds, reactionKinds, repostKinds} from "src/util/nostr"
import {partition, uniq, without} from "ramda"
import {CUSTOM_LIST_KINDS} from "src/domain"
import {
  env,
  getUserCircles,
  load,
  subscribePersistent,
  sessionWithMeta,
  groupAdminKeys,
  groupSharedKeys,
  type MySubscribeRequest,
} from "src/engine/state"
import {sortEventsDesc} from "src/engine/utils"

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

export const loadAll = (feed, opts: LoadOpts = {}) => {
  const loading = writable(true)

  const stop = () => loading.set(false)

  const promise = new Promise<void>(async resolve => {
    const load = await feedLoader.getLoader(feed, {
      onEvent: opts.onEvent,
      onExhausted: () => {
        opts.onExhausted?.()
        stop()
      },
    })

    while (get(loading)) {
      await load(100)
    }

    resolve()
  })

  return {promise, loading, stop}
}

// Groups

export const attemptedAddrs = new Map()

export const getStaleAddrs = (addrs: string[]) => {
  const stale = new Set<string>()

  for (const addr of addrs) {
    const attempts = attemptedAddrs.get(addr) | 0

    if (attempts > 0) {
      continue
    }

    stale.add(addr)

    attemptedAddrs.set(addr, attempts + 1)
  }

  return Array.from(stale)
}

export const loadGroups = async (rawAddrs: string[], explicitRelays: string[] = []) => {
  const addrs = getStaleAddrs(rawAddrs)
  const authors = addrs.map(a => Address.from(a).pubkey)
  const identifiers = addrs.map(a => Address.from(a).identifier)

  if (addrs.length > 0) {
    const filters = [{kinds: [34550, 35834], authors, "#d": identifiers}]
    const relays = ctx.app.router
      .merge([
        ctx.app.router.product(addrs, explicitRelays),
        ctx.app.router.WithinMultipleContexts(addrs),
      ])
      .getUrls()

    return load({relays, filters, skipCache: true, forcePlatform: false})
  }
}

export const loadGroupMessages = async (addrs: string[]) => {
  for (const address of addrs) {
    const keys = [...groupAdminKeys.get(), ...groupSharedKeys.get()]
    const pubkeys = keys.filter(k => k.group === address).map(k => k.pubkey)

    await pullConservatively({
      relays: ctx.app.router.WithinContext(address).getUrls(),
      filters: [{kinds: [WRAP], "#p": pubkeys}],
    })
  }
}

export const loadCommunityMessages = async (addrs: string[]) => {
  await pullConservatively({
    relays: ctx.app.router.WithinMultipleContexts(addrs).getUrls(),
    filters: [{kinds: [...noteKinds, ...repostKinds], "#a": addrs}],
  })
}

export const loadCircleMessages = async (addrs?: string[]) => {
  if (!addrs) {
    addrs = getUserCircles(sessionWithMeta.get())
  }

  const [groups, communities] = partition(isGroupAddress, addrs)

  loadGroupMessages(groups)
  loadCommunityMessages(communities)
}

export const loadEvent = async (idOrAddress: string, request: Partial<MySubscribeRequest> = {}) =>
  first(
    await load({
      ...request,
      skipCache: true,
      forcePlatform: false,
      filters: getIdFilters([idOrAddress]),
    }),
  )

export const deriveEvent = (idOrAddress: string, request: Partial<MySubscribeRequest> = {}) => {
  let attempted = false

  const filters = getIdFilters([idOrAddress])

  return derived(
    deriveEvents(repository, {filters, includeDeleted: true}),
    (events: TrustedEvent[]) => {
      if (!attempted && events.length === 0) {
        loadEvent(idOrAddress, request)
        attempted = true
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

        load({
          onEvent,
          skipCache: true,
          forcePlatform: false,
          filters: [{kinds: [0], search: term, limit: 100}],
          onComplete: async () => {
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

// Feeds

export const feedLoader = new FeedLoader({
  request: async ({relays, filters, onEvent}) => {
    if (relays?.length > 0) {
      await load({filters, relays, onEvent, skipCache: true, forcePlatform: false})
    } else {
      await Promise.all(
        getFilterSelections(filters).map(({relays, filters}) => load({filters, relays, onEvent})),
      )
    }
  },
  requestDVM: async ({kind, onEvent, tags = [], ...request}) => {
    tags = [...tags, ["expiration", String(now() + 5)]]

    const req = makeDvmRequest({
      event: await signer.get().sign(createEvent(kind, {tags})),
      relays:
        request.relays?.length > 0
          ? ctx.app.router.fromRelays(request.relays).getUrls()
          : ctx.app.router.Messages(tags.filter(nthEq(0, "p")).map(nth(1))).getUrls(),
    })

    await new Promise<void>(resolve => {
      req.emitter.on("result", (url, event) => {
        onEvent(event)
        resolve()
      })
    })
  },
  getPubkeysForScope: (scope: string) => {
    const $pubkey = pubkey.get()

    const pubkeys = switcherFn(scope, {
      [Scope.Self]: () => ($pubkey ? [$pubkey] : []),
      [Scope.Follows]: () => getFollows($pubkey),
      [Scope.Network]: () => getNetwork($pubkey),
      [Scope.Followers]: () => getFollowers($pubkey),
      default: always([]),
    })

    return pubkeys.length === 0 ? env.DEFAULT_FOLLOWS : pubkeys
  },
  getPubkeysForWOTRange: (min, max) => {
    const pubkeys = []
    const thresholdMin = maxWot.get() * min
    const thresholdMax = maxWot.get() * max

    for (const [tpk, score] of wotGraph.get().entries()) {
      if (score >= thresholdMin && score <= thresholdMax) {
        pubkeys.push(tpk)
      }
    }

    return pubkeys
  },
})

// Notifications

export const getNotificationKinds = () =>
  without(env.ENABLE_ZAPS ? [] : [9735], [...noteKinds, ...reactionKinds])

export const loadNotifications = () => {
  const filter = {kinds: getNotificationKinds(), "#p": [pubkey.get()]}

  return pullConservatively({
    relays: ctx.app.router.ReadRelays().getUrls(),
    filters: [addSinceToFilter(filter, int(WEEK))],
  })
}

export const listenForNotifications = () => {
  const filter = {kinds: getNotificationKinds(), "#p": [pubkey.get()]}

  subscribePersistent({
    timeout: 30_000,
    skipCache: true,
    relays: ctx.app.router.User().getUrls(),
    filters: [addSinceToFilter(filter)],
  })
}

// Other user data

export const loadLabels = (authors: string[]) =>
  load({
    skipCache: true,
    forcePlatform: false,
    filters: [addSinceToFilter({kinds: [LABEL], authors, "#L": ["#t"]})],
  })

export const loadDeletes = () =>
  load({
    skipCache: true,
    forcePlatform: false,
    filters: [addSinceToFilter({kinds: [DELETE], authors: [pubkey.get()]})],
  })

export const loadSeen = () =>
  load({
    skipCache: true,
    filters: [
      addSinceToFilter({
        kinds: [SEEN_CONVERSATION, SEEN_GENERAL, SEEN_CONTEXT],
        authors: [pubkey.get()],
      }),
    ],
  })

export const loadFeedsAndLists = () =>
  load({
    skipCache: true,
    forcePlatform: false,
    filters: [
      addSinceToFilter({
        kinds: [FEED, FEEDS, NAMED_BOOKMARKS, ...CUSTOM_LIST_KINDS],
        authors: [pubkey.get()],
      }),
    ],
  })

export const loadMessages = () =>
  pullConservatively({
    relays: ctx.app.router.User().getUrls(),
    filters: [
      {kinds: [DEPRECATED_DIRECT_MESSAGE], authors: [pubkey.get()]},
      {kinds: [DEPRECATED_DIRECT_MESSAGE, WRAP], "#p": [pubkey.get()]},
    ],
  })

export const listenForMessages = (pubkeys: string[]) => {
  const allPubkeys = uniq(pubkeys.concat(pubkey.get()))

  return subscribePersistent({
    skipCache: true,
    forcePlatform: false,
    relays: ctx.app.router.Messages(pubkeys).getUrls(),
    filters: [
      {kinds: [DEPRECATED_DIRECT_MESSAGE], authors: allPubkeys, "#p": allPubkeys},
      {kinds: [WRAP], "#p": [pubkey.get()]},
    ],
  })
}

export const loadHandlers = () =>
  load({
    skipCache: true,
    forcePlatform: false,
    relays: ctx.app.router.ReadRelays().getUrls().concat("wss://relay.nostr.band/"),
    filters: [
      addSinceToFilter({
        kinds: [HANDLER_RECOMMENDATION],
        authors: getFollows(pubkey.get()),
      }),
      addSinceToFilter({kinds: [HANDLER_INFORMATION]}),
    ],
  })
