import {debounce} from "throttle-debounce"
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
import {Worker, now, writable} from "@welshman/lib"
import type {Filter, TrustedEvent, SignedEvent} from "@welshman/util"
import {
  Tags,
  decodeAddress,
  getIdFilters,
  isGroupAddress,
  isSignedEvent,
  HANDLER_INFORMATION,
  HANDLER_RECOMMENDATION,
} from "@welshman/util"
import {updateIn} from "src/util/misc"
import {
  generatePrivateKey,
  giftWrapKinds,
  noteKinds,
  reactionKinds,
  repostKinds,
} from "src/util/nostr"
import {always, assocPath, find, max, partition, pluck, uniq, whereEq, without} from "ramda"
import {
  deriveUserCircles,
  getGroupReqInfo,
  getCommunityReqInfo,
  channels,
  groups,
  dvmRequest,
  env,
  follows,
  forcePlatformRelays,
  getFilterSelections,
  getFollowers,
  getUserCommunities,
  getWotScore,
  hints,
  isEventMuted,
  load,
  loadOne,
  loadPubkeys,
  maxWot,
  network,
  nip04,
  nip44,
  people,
  primeWotCaches,
  pubkey,
  publish,
  searchableRelays,
  session,
  sessions,
  subscribe,
  subscribePersistent,
  user,
  withFallbacks,
} from "src/engine/state"
import {updateCurrentSession, updateSession} from "src/engine/commands"

export const attemptedAddrs = new Map()

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

export const loadGroups = async (rawAddrs: string[], relays: string[] = []) => {
  const addrs = getStaleAddrs(rawAddrs)
  const authors = addrs.map(a => decodeAddress(a).pubkey)
  const identifiers = addrs.map(a => decodeAddress(a).identifier)

  if (addrs.length > 0) {
    return load({
      relays: forcePlatformRelays(
        hints.merge([hints.product(addrs, relays), hints.WithinMultipleContexts(addrs)]).getUrls(),
      ),
      filters: [{kinds: [34550, 35834], authors, "#d": identifiers}],
    })
  }
}

export const loadGroupMessages = (addresses?: string[]) => {
  const promises = []
  const addrs = addresses || deriveUserCircles().get()
  const [groupAddrs, communityAddrs] = partition(a => isGroupAddress(decodeAddress(a)), addrs)

  for (const address of groupAddrs) {
    const {admins, recipients, relays, since} = getGroupReqInfo(address)
    const pubkeys = [pubkey.get(), ...admins, ...recipients]

    if (pubkeys.length > 0) {
      promises.push(load({relays, filters: [{kinds: giftWrapKinds, "#p": pubkeys, since}]}))
    }
  }

  for (const address of communityAddrs) {
    const {relays, ...info} = getCommunityReqInfo(address)
    const kinds = [...noteKinds, ...repostKinds]
    const since = Math.max(now() - seconds(7, "day"), info.since)

    promises.push(load({relays, filters: [{kinds, "#a": [address], since}]}))
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
  identifier = null,
  relays = [],
  context = [],
}) => {
  if (eid) {
    const note = find(whereEq({id: eid}), context)

    if (note) {
      return note
    }

    return loadOne({
      relays: withFallbacks(relays),
      filters: getIdFilters([eid]),
    })
  }

  if (kind && pubkey) {
    const note = find(e => {
      if (!whereEq({kind, pubkey}, e)) {
        return false
      }

      return !identifier || Tags.fromEvent(e).get("d")?.value() === identifier
    }, context)

    if (note) {
      return note
    }

    return loadOne({
      relays: withFallbacks(relays),
      filters: [{kinds: [kind], authors: [pubkey], "#d": [identifier]}],
    }).then((event: TrustedEvent) => {
      return note?.created_at > event.created_at ? note : event
    })
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

export const loadDeletes = () => {
  const {pubkey, deletes_last_synced = 0} = session.get()
  const since = Math.max(0, deletes_last_synced - seconds(6, "hour"))

  return load({
    relays: hints.User().getUrls(),
    filters: [{kinds: [5], authors: [pubkey], since}],
  })
}

export const loadSeen = () => {
  const {pubkey, deletes_last_synced = 0} = session.get()
  const since = Math.max(0, deletes_last_synced - seconds(6, "hour"))

  return load({
    relays: hints.WriteRelays().getUrls(),
    filters: [{kinds: [15], authors: [pubkey], since}],
  })
}

export const loadGiftWrap = () => {
  const kinds = []

  if (nip44.get().isEnabled()) {
    kinds.push(1059)
  }

  if (nip04.get().isEnabled()) {
    kinds.push(1060)
  }

  if (kinds.length > 0) {
    const {pubkey, nip59_messages_last_synced = 0} = session.get()
    const since = Math.max(0, nip59_messages_last_synced - seconds(6, "hour"))

    return load({
      skipCache: true,
      relays: hints.User().getUrls(),
      filters: [{kinds: giftWrapKinds, authors: [pubkey], since}],
    })
  }
}

export const feedLoader = new FeedLoader<TrustedEvent>({
  request: async ({relays, filters, onEvent}) => {
    if (relays.length > 0) {
      await load({filters, relays, onEvent})
    } else {
      await Promise.all(
        getFilterSelections(filters).map(({relay, filters}) =>
          load({filters, relays: [relay], onEvent}),
        ),
      )
    }
  },
  requestDVM: async ({kind, tags = [], relays = [], onEvent}) => {
    const sk = generatePrivateKey()
    const event = await dvmRequest({kind, tags, relays, sk, timeout: 3000})

    if (event) {
      onEvent(event)
    }
  },
  getPubkeysForScope: (scope: string) => {
    const $user = user.get()

    const pubkeys = switcherFn(scope, {
      [Scope.Self]: () => ($user ? [$user.pubkey] : []),
      [Scope.Follows]: () => Array.from(follows.get()),
      [Scope.Network]: () => Array.from(network.get()),
      [Scope.Followers]: () => Array.from(getFollowers($user.pubkey).map(p => p.pubkey)),
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
          .reduce(max, 0),
      ),
    )
  }

  loadPubkeys(pubkeys)

  if (eventsWithParent.length > 0) {
    const relays = hints.merge(eventsWithParent.map(hints.EventParents)).getUrls()
    const ids = eventsWithParent.flatMap(e => Tags.fromEvent(e).replies().values().valueOf())

    load({relays, filters: getIdFilters(ids)})
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
  const {pubkey, nip24_messages_last_synced = 0} = session.get()
  const since = reload ? 0 : Math.max(0, nip24_messages_last_synced - seconds(6, "hour"))

  sessions.update(assocPath([pubkey, "nip24_messages_last_synced"], now()))

  // To avoid unwrapping everything twice, listen to channels and load pubkeys there
  const unsubscribePubkeys = channels.throttle(1000).subscribe($channels => {
    loadPubkeys($channels.flatMap(c => c.members || []))
  })

  const loader = loadAll(
    makeIntersectionFeed(
      makeRelayFeed(...hints.User().getUrls()),
      makeUnionFeed(
        feedFromFilter({kinds: [4], authors: [pubkey], since}),
        feedFromFilter({kinds: [4, 1059], "#p": [pubkey], since}),
      ),
    ),
  )

  loader.promise.then(() => {
    unsubscribePubkeys()
  })

  return loader
}

export const listenForMessages = (pubkeys: string[]) => {
  const {pubkey} = session.get()
  const allPubkeys = uniq(pubkeys.concat(pubkey))

  return subscribe({
    skipCache: true,
    relays: hints.Messages(pubkeys).getUrls(),
    filters: [
      {kinds: [4], authors: allPubkeys, "#p": allPubkeys},
      {kinds: [1059], "#p": [pubkey]},
    ],
  })
}

export const loadHandlers = () => {
  const $follows = follows.get()

  load({
    relays: hints.ReadRelays().getUrls(),
    filters: [
      {kinds: [HANDLER_RECOMMENDATION], authors: Array.from($follows)},
      {kinds: [HANDLER_INFORMATION]},
    ],
  })
}
