import {debounce} from "throttle-debounce"
import {batch, Fetch, noop, tryFunc, seconds, createMapOf, sleep, switcherFn} from "hurdak"
import type {LoadOpts} from "@welshman/feeds"
import {
  FeedLoader,
  Scope,
  feedFromFilter,
  makeIntersectionFeed,
  makeRelayFeed,
  makeUnionFeed,
} from "@welshman/feeds"
import {
  Worker,
  bech32ToHex,
  pick,
  cached,
  nthEq,
  nth,
  fromPairs,
  now,
  writable,
  max,
} from "@welshman/lib"
import type {Filter, TrustedEvent, SignedEvent} from "@welshman/util"
import {
  Tags,
  Address,
  getIdFilters,
  isGroupAddress,
  isSignedEvent,
  EPOCH,
  LABEL,
  DELETE,
  READ_RECEIPT,
  HANDLER_INFORMATION,
  HANDLER_RECOMMENDATION,
} from "@welshman/util"
import {updateIn, createBatcher} from "src/util/misc"
import {giftWrapKinds, noteKinds, reactionKinds, repostKinds} from "src/util/nostr"
import {always, partition, pluck, uniq, whereEq, without} from "ramda"
import type {Zapper} from "src/engine/model"
import {repository} from "src/engine/repository"
import {
  deriveUserCircles,
  getGroupReqInfo,
  getCommunityReqInfo,
  groups,
  dvmRequest,
  env,
  getFollows,
  forcePlatformRelays,
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
  nip04,
  nip44,
  people,
  primeWotCaches,
  pubkey,
  publish,
  searchableRelays,
  session,
  subscribe,
  subscribePersistent,
  user,
  withFallbacks,
  dufflepud,
} from "src/engine/state"
import {updateCurrentSession, updateSession} from "src/engine/commands"
import {loadPubkeyRelays, loadPubkeys} from "src/engine/requests/pubkeys"

export * from "src/engine/requests/pubkeys"

export const attemptedAddrs = new Map()

export const addSinceToFilter = (filter, overlap = seconds(1, "hour")) => {
  const limit = 50
  const events = repository.query([{...filter, limit}])

  // If we only have a few events, it won't hurt to re-fetch everything. This can happen when
  // we fetch notifications with a limit of 1, giving us just a handful of events without pulling
  // the full dataset.
  const since = events.length < limit
    ? EPOCH
    : max(events.map(e => e.created_at).concat(EPOCH)) - overlap

  return {...filter, since}
}

// Handles/Zappers

const fetchHandle = createBatcher(500, async (handles: string[]) => {
  const data =
    (await tryFunc(async () => {
      const res = await Fetch.postJson(dufflepud("handle/info"), {handles: uniq(handles)})

      return res?.data
    })) || []

  const infoByHandle = createMapOf("handle", "info", data)

  return handles.map(h => infoByHandle[h])
})

export const loadHandle = cached({
  maxSize: 100,
  getKey: ([handle]) => handle,
  getValue: ([handle]) => fetchHandle(handle),
})

const fetchZapper = createBatcher(3000, async (lnurls: string[]) => {
  const data =
    (await tryFunc(async () => {
      // Dufflepud expects plaintext but we store lnurls encoded
      const res = await Fetch.postJson(dufflepud("zapper/info"), {
        lnurls: uniq(lnurls).map(bech32ToHex),
      })

      return res?.data
    })) || []

  const infoByLnurl = createMapOf("lnurl", "info", data)

  return lnurls.map(lnurl => {
    const zapper = tryFunc(() => infoByLnurl[bech32ToHex(lnurl)])

    if (!zapper) {
      return null
    }

    return {
      ...pick(["callback", "minSendable", "maxSendable", "nostrPubkey", "allowsNostr"], zapper),
      lnurl,
    } as Zapper
  })
})

export const loadZapper = cached({
  maxSize: 100,
  getKey: ([handle]) => handle,
  getValue: ([handle]) => fetchZapper(handle),
})

export const getStaleAddrs = (addrs: string[]) => {
  const stale = new Set<string>()

  for (const addr of addrs) {
    const attempts = attemptedAddrs.get(addr) | 0

    if (attempts > 1) {
      continue
    }

    attemptedAddrs.set(addr, attempts + 1)

    const group = groups.key(addr).get()

    if (!group?.meta) {
      stale.add(addr)
    }
  }

  return Array.from(stale)
}

export const loadGroups = async (rawAddrs: string[], explicitRelays: string[] = []) => {
  const addrs = getStaleAddrs(rawAddrs)
  const authors = addrs.map(a => Address.from(a).pubkey)
  const identifiers = addrs.map(a => Address.from(a).identifier)

  if (addrs.length > 0) {
    const filters = [{kinds: [34550, 35834], authors, "#d": identifiers}]
    const relays = forcePlatformRelays(
      hints
        .merge([hints.product(addrs, explicitRelays), hints.WithinMultipleContexts(addrs)])
        .getUrls(),
    )

    return load({relays, filters, skipCache: true})
  }
}

export const loadGroupMessages = (addresses?: string[]) => {
  const promises = []
  const addrs = addresses || deriveUserCircles().get()
  const [groupAddrs, communityAddrs] = partition(isGroupAddress, addrs)

  for (const address of groupAddrs) {
    const {admins, recipients, relays, since} = getGroupReqInfo(address)
    const pubkeys = uniq([pubkey.get(), ...admins, ...recipients])
    const filters = [{kinds: giftWrapKinds, "#p": pubkeys, since}]

    if (pubkeys.length > 0) {
      promises.push(load({relays, filters, skipCache: true}))
    }
  }

  for (const address of communityAddrs) {
    const {relays, ...info} = getCommunityReqInfo(address)
    const kinds = [...noteKinds, ...repostKinds]
    const since = Math.max(now() - seconds(7, "day"), info.since)
    const filters = [{kinds, "#a": [address], since}]

    promises.push(load({relays, filters, skipCache: true}))
  }

  updateCurrentSession($session => {
    for (const address of addrs) {
      if ($session.groups?.[address]) {
        $session.groups[address].last_synced = now()
      }
    }

    return $session
  })

  return Promise.all(promises)
}

export const dereferenceNote = async ({
  eid = null,
  kind = null,
  pubkey = null,
  identifier = "",
  relays = [],
  context = [],
}) => {
  relays = withFallbacks(relays)

  if (eid) {
    return context.find(whereEq({id: eid})) || loadOne({relays, filters: getIdFilters([eid])})
  }

  if (kind && pubkey) {
    const address = new Address(kind, pubkey, identifier).toString()
    const addrData = {kind, pubkey, identifier}

    return (
      context.find(e => whereEq(addrData, {...e, identifier: fromPairs(e.tags).d || ""})) ||
      loadOne({relays, filters: getIdFilters([address])})
    )
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

  return {
    loading,
    load: debounce(500, term => {
      if (term.length > 2 && shouldLoad(term)) {
        const now = Date.now()

        loading.set(true)

        load({
          onEvent,
          skipCache: true,
          relays: searchableRelays.get(),
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

export const loadLabels = () =>
  load({
    skipCache: true,
    relays: hints.User().getUrls(),
    filters: [addSinceToFilter({kinds: [LABEL], authors: [pubkey.get()], "#L": ["#t"]})],
  })

export const loadDeletes = () =>
  load({
    skipCache: true,
    relays: hints.User().getUrls(),
    filters: [addSinceToFilter({kinds: [DELETE], authors: [pubkey.get()]})],
  })

export const loadSeen = () =>
  load({
    skipCache: true,
    relays: hints.WriteRelays().getUrls(),
    filters: [addSinceToFilter({kinds: [READ_RECEIPT], authors: [pubkey.get()]})],
  })

export const loadGiftWrap = () => {
  const kinds = []

  if (nip44.get().isEnabled()) {
    kinds.push(1059)
  }

  if (nip04.get().isEnabled()) {
    kinds.push(1060)
  }

  if (kinds.length > 0) {
    return load({
      skipCache: true,
      relays: hints.User().getUrls(),
      filters: [addSinceToFilter({kinds, authors: [pubkey.get()]})],
    })
  }
}

export const feedLoader = new FeedLoader<TrustedEvent>({
  request: async ({relays, filters, onEvent}) => {
    if (relays.length > 0) {
      await load({filters, relays, onEvent, skipCache: true})
    } else {
      await Promise.all(
        getFilterSelections(filters).map(({relay, filters}) =>
          load({filters, relays: [relay], onEvent}),
        ),
      )
    }
  },
  requestDVM: async ({kind, onEvent, tags = [], ...request}) => {
    let relays
    if (request.relays?.length > 0) {
      relays = hints.fromRelays(request.relays).getUrls()
    } else {
      const pubkeys = tags.filter(nthEq(0, "p")).map(nth(1))

      await loadPubkeyRelays(pubkeys)

      relays = hints.Messages(pubkeys).getUrls()
    }

    const event = await dvmRequest({kind, tags, relays})

    if (event) {
      onEvent(event)
    }
  },
  getPubkeysForScope: (scope: string) => {
    const $user = user.get()

    const pubkeys = switcherFn(scope, {
      [Scope.Self]: () => ($user ? [$user.pubkey] : []),
      [Scope.Follows]: () => Array.from(getFollows($user.pubkey)),
      [Scope.Network]: () => Array.from(getNetwork($user.pubkey)),
      [Scope.Followers]: () => Array.from(getFollowers($user.pubkey)),
    })

    return pubkeys.length === 0 ? env.get().DEFAULT_FOLLOWS : pubkeys
  },
  getPubkeysForWOTRange: (min, max) => {
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
  },
})

export const loadAll = (feed, opts: LoadOpts<TrustedEvent> = {}) => {
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

    while (loading.get()) {
      await load(100)
    }

    resolve()
  })

  return {promise, loading, stop}
}

export const sync = (fromUrl, toUrl, filters) => {
  const worker = new Worker<SignedEvent>()

  worker.addGlobalHandler(event => publish({event, relays: [toUrl]}))

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
    updateSession(
      pubkey,
      updateIn("notifications_last_synced", (t: number) =>
        pluck("created_at", events)
          .concat(t || 0)
          .reduce((a, b) => Math.max(a, b), 0),
      ),
    )
  }

  loadPubkeys(pubkeys)

  if (eventsWithParent.length > 0) {
    const relays = hints.merge(eventsWithParent.map(hints.EventParents)).getUrls()
    const ids = eventsWithParent.flatMap(e => Tags.fromEvent(e).replies().values().valueOf())

    load({relays, filters: getIdFilters(ids), skipCache: true})
  }
})

export const getNotificationKinds = () =>
  without(env.get().ENABLE_ZAPS ? [] : [9735], [
    ...noteKinds,
    ...reactionKinds,
    ...giftWrapKinds,
    4,
  ])

export const loadNotifications = () => {
  const kinds = getNotificationKinds()
  const cutoff = now() - seconds(30, "day")
  const {pubkey, notifications_last_synced = 0} = session.get()
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

export const listenForNotifications = async () => {
  const since = now() - 30
  const $session = session.get()
  const addrs = getUserCommunities($session)

  const filters: Filter[] = [
    // Mentions
    {kinds: noteKinds, "#p": [$session.pubkey], limit: 1, since},
    // Messages/groups
    {kinds: [4, ...giftWrapKinds], "#p": [$session.pubkey], limit: 1, since},
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

export const loadAllMessages = ({reload = false} = {}) => {
  let filters = [
    {kinds: [1059], "#p": [pubkey.get()]},
    {kinds: [4], authors: [pubkey.get()]},
    {kinds: [4], "#p": [pubkey.get()]},
  ]

  if (!reload) {
    filters = [
      addSinceToFilter(filters[0], seconds(7, "day")),
      addSinceToFilter(filters[1]),
      addSinceToFilter(filters[2]),
    ]
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
    relays: hints.Messages(pubkeys).getUrls(),
    filters: [
      addSinceToFilter({kinds: [1059], "#p": [pubkey.get()]}, seconds(7, "day")),
      addSinceToFilter({kinds: [4], authors: allPubkeys}),
      addSinceToFilter({kinds: [4], "#p": allPubkeys}),
    ],
  })
}

export const loadHandlers = () =>
  load({
    skipCache: true,
    relays: hints.ReadRelays().getUrls(),
    filters: [
      addSinceToFilter({
        kinds: [HANDLER_RECOMMENDATION],
        authors: Array.from(getFollows(pubkey.get())),
      }),
      addSinceToFilter({kinds: [HANDLER_INFORMATION]}),
    ],
  })
