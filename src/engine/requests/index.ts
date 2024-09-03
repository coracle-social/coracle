import {debounce} from "throttle-debounce"
import {get, writable} from "svelte/store"
import {batch, noop, seconds, sleep, switcherFn} from "hurdak"
import type {LoadOpts} from "@welshman/feeds"
import {
  FeedLoader,
  Scope,
  feedFromFilter,
  makeIntersectionFeed,
  makeRelayFeed,
  makeUnionFeed,
} from "@welshman/feeds"
import {Worker, nthEq, nth, now, max} from "@welshman/lib"
import type {Filter, TrustedEvent, SignedEvent} from "@welshman/util"
import {
  Tags,
  Address,
  getIdFilters,
  isGroupAddress,
  isSignedEvent,
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
} from "@welshman/util"
import {makeDvmRequest} from "@welshman/dvm"
import {pubkey, relays, repository, signer, getSession, updateSession} from "@welshman/app"
import {updateIn} from "src/util/misc"
import {noteKinds, reactionKinds, repostKinds} from "src/util/nostr"
import {always, partition, pluck, uniq, without} from "ramda"
import {LIST_KINDS, filterRelaysByNip} from "src/domain"
import type {SessionWithMeta} from "src/engine/model"
import {
  env,
  getUserCircles,
  getGroupReqInfo,
  getCommunityReqInfo,
  getFilterSelections,
  getFollowers,
  getUserCommunities,
  getWotScore,
  hints,
  isEventMuted,
  load,
  loadOne,
  maxWot,
  getNetwork,
  primeWotCaches,
  publish,
  subscribe,
  subscribePersistent,
  sessionWithMeta,
  getFollows,
} from "src/engine/state"

export * from "src/engine/requests/pubkeys"

export const addSinceToFilter = (filter, overlap = seconds(1, "hour")) => {
  const limit = 50
  const events = repository.query([{...filter, limit}])

  // If we only have a few events, it won't hurt to re-fetch everything. This can happen when
  // we fetch notifications with a limit of 1, giving us just a handful of events without pulling
  // the full dataset.
  const since =
    events.length < limit ? EPOCH : max(events.map(e => e.created_at).concat(EPOCH)) - overlap

  return {...filter, since}
}

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
    const relays = hints
      .merge([hints.product(addrs, explicitRelays), hints.WithinMultipleContexts(addrs)])
      .getUrls()

    return load({relays, filters, skipCache: true, forcePlatform: false})
  }
}

export const loadGroupMessages = (addresses?: string[]) => {
  const promises = []
  const addrs = addresses || getUserCircles(sessionWithMeta.get())
  const [groupAddrs, communityAddrs] = partition(isGroupAddress, addrs)

  for (const address of groupAddrs) {
    const {admins, recipients, relays, since} = getGroupReqInfo(address)
    const pubkeys = uniq([...admins, ...recipients])
    const filters = [{kinds: [WRAP], "#p": pubkeys, since}]

    if (pubkeys.length > 0) {
      promises.push(load({relays, filters, skipCache: true, forcePlatform: false}))
    }
  }

  for (const address of communityAddrs) {
    const {relays, ...info} = getCommunityReqInfo(address)
    const kinds = [...noteKinds, ...repostKinds]
    const since = Math.max(now() - seconds(7, "day"), info.since)
    const filters = [{kinds, "#a": [address], since}]

    promises.push(load({relays, filters, skipCache: true, forcePlatform: false}))
  }

  updateSession(pubkey.get(), ($sessionWithMeta: SessionWithMeta) => {
    for (const address of addrs) {
      if ($sessionWithMeta.groups?.[address]) {
        $sessionWithMeta.groups[address].last_synced = now()
      }
    }

    return $sessionWithMeta
  })

  return Promise.all(promises)
}

export const dereferenceNote = async ({
  eid = null,
  kind = null,
  pubkey = null,
  identifier = "",
  relays = [],
}) => {
  relays = hints.fromRelays(relays).getUrls()

  if (eid) {
    return loadOne({relays, filters: getIdFilters([eid]), forcePlatform: false})
  }

  if (kind && pubkey) {
    const address = new Address(kind, pubkey, identifier).toString()

    return loadOne({relays, filters: getIdFilters([address]), forcePlatform: false})
  }

  return null
}

type PeopleLoaderOpts = {
  shouldLoad?: (term: string) => boolean
  onEvent?: (e: TrustedEvent) => void
}

export const createPeopleLoader = ({
  shouldLoad = always(true),
  onEvent = noop,
}: PeopleLoaderOpts = {}) => {
  const loading = writable(false)
  const nip50Relays = uniq([
    ...env.SEARCH_RELAYS,
    ...filterRelaysByNip(50, relays.get()).map(r => r.url),
  ])

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
          relays: nip50Relays.slice(0, 8),
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

export const feedLoader = new FeedLoader({
  request: async ({relays, filters, onEvent}) => {
    if (relays?.length > 0) {
      await load({filters, relays, onEvent, skipCache: true, forcePlatform: false})
    } else {
      await Promise.all(
        getFilterSelections(filters).map(({relay, filters}) =>
          load({filters, relays: [relay], onEvent}),
        ),
      )
    }
  },
  requestDVM: async ({kind, onEvent, tags = [], ...request}) => {
    tags = [...tags, ["expiration", String(now() + 5)]]

    const req = makeDvmRequest({
      event: await signer.get().sign(createEvent(kind, {tags})),
      relays:
        request.relays?.length > 0
          ? hints.fromRelays(request.relays).getUrls()
          : hints.Messages(tags.filter(nthEq(0, "p")).map(nth(1))).getUrls(),
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
    })

    return pubkeys.length === 0 ? env.DEFAULT_FOLLOWS : pubkeys
  },
  getPubkeysForWOTRange: (min, max) => {
    const pubkeys = []
    const $pubkey = pubkey.get()
    const thresholdMin = maxWot.get() * min
    const thresholdMax = maxWot.get() * max

    primeWotCaches($pubkey)

    for (const tpk of repository.eventsByAuthor.keys()) {
      const score = getWotScore($pubkey, tpk)

      if (score >= thresholdMin && score <= thresholdMax) {
        pubkeys.push(tpk)
      }
    }

    return pubkeys
  },
})

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

export const sync = (fromUrl, toUrl, filters) => {
  const worker = new Worker<SignedEvent>()

  worker.addGlobalHandler(event => publish({event, relays: [toUrl], forcePlatform: false}))

  const feed = makeIntersectionFeed(
    makeRelayFeed(fromUrl),
    makeUnionFeed(...filters.map(feedFromFilter)),
  )

  return loadAll(feed, {
    onEvent: e => {
      if (isSignedEvent(e)) {
        worker.push(e)
      }
    },
  })
}

const onNotificationEvent = batch(300, (chunk: TrustedEvent[]) => {
  const kinds = getNotificationKinds()
  const $isEventMuted = isEventMuted.get()
  const events = chunk.filter(e => kinds.includes(e.kind) && !$isEventMuted(e))
  const eventsWithParent = chunk.filter(e => Tags.fromEvent(e).parent())
  const pubkeys = uniq(pluck("pubkey", events))

  for (const pubkey of pubkeys) {
    if (getSession(pubkey)) {
      updateSession(
        pubkey,
        updateIn("notifications_last_synced", (t: number) =>
          pluck("created_at", events)
            .concat(t || 0)
            .reduce((a, b) => Math.max(a, b), 0),
        ),
      )
    }
  }

  if (eventsWithParent.length > 0) {
    const relays = hints.merge(eventsWithParent.map(hints.EventParents)).getUrls()
    const ids = eventsWithParent.flatMap(e => Tags.fromEvent(e).replies().values().valueOf())

    load({relays, filters: getIdFilters(ids), skipCache: true})
  }
})

export const getNotificationKinds = () =>
  without(env.ENABLE_ZAPS ? [] : [9735], [
    ...noteKinds,
    ...reactionKinds,
    WRAP,
    DEPRECATED_DIRECT_MESSAGE,
  ])

export const loadNotifications = () => {
  const kinds = getNotificationKinds()
  const cutoff = now() - seconds(30, "day")
  const {pubkey, notifications_last_synced = 0} = sessionWithMeta.get()
  const since = Math.max(cutoff, notifications_last_synced - seconds(6, "hour"))

  const filters = [
    {kinds, "#p": [pubkey], since},
    {kinds, authors: [pubkey], since},
  ]

  return subscribe({
    filters,
    timeout: 15000,
    skipCache: true,
    closeOnEose: true,
    relays: hints.ReadRelays().getUrls(),
    onEvent: onNotificationEvent,
  })
}

export const listenForNotifications = () => {
  const since = now() - 30
  const $sessionWithMeta = sessionWithMeta.get()
  const addrs = getUserCommunities($sessionWithMeta)

  const filters: Filter[] = [
    // Mentions
    {kinds: noteKinds, "#p": [$sessionWithMeta.pubkey], limit: 1, since},
    // Messages/groups
    {kinds: [DEPRECATED_DIRECT_MESSAGE, WRAP], "#p": [$sessionWithMeta.pubkey], limit: 1, since},
  ]

  // Communities
  if (addrs.length > 0) {
    filters.push({kinds: [...noteKinds, ...repostKinds], "#a": addrs, limit: 1, since})
  }

  // Only grab one event from each category/relay so we have enough to show
  // the notification badges, but load the details lazily
  subscribePersistent({
    filters,
    timeout: 30_000,
    skipCache: true,
    relays: hints.ReadRelays().getUrls(),
    onEvent: onNotificationEvent,
  })
}

export const loadLabels = (authors: string[]) =>
  load({
    skipCache: true,
    forcePlatform: false,
    relays: hints.FromPubkeys(authors).getUrls(),
    filters: [addSinceToFilter({kinds: [LABEL], authors, "#L": ["#t"]})],
  })

export const loadDeletes = () =>
  load({
    skipCache: true,
    forcePlatform: false,
    relays: hints.User().getUrls(),
    filters: [addSinceToFilter({kinds: [DELETE], authors: [pubkey.get()]})],
  })

export const loadSeen = () =>
  load({
    skipCache: true,
    relays: hints.WriteRelays().getUrls(),
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
    relays: hints.WriteRelays().getUrls(),
    filters: [
      addSinceToFilter({kinds: [FEED, NAMED_BOOKMARKS, ...LIST_KINDS], authors: [pubkey.get()]}),
    ],
  })

export const loadGiftWraps = ({reload = false} = {}) => {
  let filter = {kinds: [WRAP], "#p": [pubkey.get()]}

  if (!reload) {
    filter = addSinceToFilter(filter, seconds(7, "day"))
  }

  return loadAll(
    makeIntersectionFeed(makeRelayFeed(...hints.User().getUrls()), feedFromFilter(filter)),
  )
}

export const loadLegacyMessages = ({reload = false} = {}) => {
  let filters = [
    {kinds: [4], authors: [pubkey.get()]},
    {kinds: [4], "#p": [pubkey.get()]},
  ]

  if (!reload) {
    filters = filters.map(addSinceToFilter)
  }

  return loadAll(
    makeIntersectionFeed(
      makeRelayFeed(...hints.User().getUrls()),
      makeUnionFeed(...filters.map(feedFromFilter)),
    ),
  )
}

export const listenForMessages = (pubkeys: string[]) => {
  const allPubkeys = uniq(pubkeys.concat(pubkey.get()))

  return subscribePersistent({
    skipCache: true,
    forcePlatform: false,
    relays: hints.Messages(pubkeys).getUrls(),
    filters: [
      addSinceToFilter({kinds: [WRAP], "#p": [pubkey.get()]}, seconds(14, "day")),
      addSinceToFilter({kinds: [4], authors: allPubkeys}),
      addSinceToFilter({kinds: [4], "#p": allPubkeys}),
    ],
  })
}

export const loadHandlers = () =>
  load({
    skipCache: true,
    forcePlatform: false,
    relays: hints.ReadRelays().getUrls().concat("wss://relay.nostr.band/"),
    filters: [
      addSinceToFilter({
        kinds: [HANDLER_RECOMMENDATION],
        authors: getFollows(pubkey.get()),
      }),
      addSinceToFilter({kinds: [HANDLER_INFORMATION]}),
    ],
  })
