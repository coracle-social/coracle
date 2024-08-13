import {debounce} from "throttle-debounce"
import {get, writable} from "svelte/store"
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
import {Worker, bech32ToHex, batcher, pick, cached, nthEq, nth, now, max} from "@welshman/lib"
import type {Filter, TrustedEvent, SignedEvent} from "@welshman/util"
import {
  Tags,
  Address,
  getIdFilters,
  isGroupAddress,
  isSignedEvent,
  createEvent,
  WRAP,
  WRAP_NIP04,
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
} from "@welshman/util"
import {makeDvmRequest} from "@welshman/dvm"
import {updateIn} from "src/util/misc"
import {giftWrapKinds, noteKinds, reactionKinds, repostKinds} from "src/util/nostr"
import {always, partition, pluck, uniq, without} from "ramda"
import {LIST_KINDS} from "src/domain"
import type {Zapper} from "src/engine/model"
import {repository} from "src/engine/repository"
import {
  getUserCircles,
  getGroupReqInfo,
  getCommunityReqInfo,
  env,
  getFollows,
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
  pubkey,
  publish,
  getNip50Relays,
  session,
  subscribe,
  subscribePersistent,
  dufflepud,
  signer,
} from "src/engine/state"
import {updateCurrentSession, updateSession} from "src/engine/commands"

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

// Handles/Zappers

const fetchHandle = batcher(500, async (handles: string[]) => {
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

const fetchZapper = batcher(3000, async (lnurls: string[]) => {
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
  const addrs = addresses || getUserCircles(session.get())
  const [groupAddrs, communityAddrs] = partition(isGroupAddress, addrs)

  for (const address of groupAddrs) {
    const {admins, recipients, relays, since} = getGroupReqInfo(address)
    const pubkeys = uniq([...admins, ...recipients])
    const filters = [{kinds: giftWrapKinds, "#p": pubkeys, since}]

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
          relays: getNip50Relays().slice(0, 8),
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
      [Scope.Follows]: () => Array.from(getFollows($pubkey)),
      [Scope.Network]: () => Array.from(getNetwork($pubkey)),
      [Scope.Followers]: () => Array.from(getFollowers($pubkey)),
    })

    return pubkeys.length === 0 ? env.get().DEFAULT_FOLLOWS : pubkeys
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
    updateSession(
      pubkey,
      updateIn("notifications_last_synced", (t: number) =>
        pluck("created_at", events)
          .concat(t || 0)
          .reduce((a, b) => Math.max(a, b), 0),
      ),
    )
  }

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

export const listenForNotifications = () => {
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
  let filter = {kinds: [WRAP, WRAP_NIP04], "#p": [pubkey.get()]}

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
        authors: Array.from(getFollows(pubkey.get())),
      }),
      addSinceToFilter({kinds: [HANDLER_INFORMATION]}),
    ],
  })
