import {debounce} from "throttle-debounce"
import {writable, derived} from "svelte/store"
import {
  without,
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
import type {AppSyncOpts, User} from "@welshman/app"
import {deriveEvents} from "@welshman/store"
import {
  Address,
  DELETE,
  DEPRECATED_DIRECT_MESSAGE,
  EPOCH,
  FEED,
  FEEDS,
  LABEL,
  NAMED_BOOKMARKS,
  POLL_RESPONSE,
  WRAP,
  getIdFilters,
  inbox,
  outbox,
  relays as relaySelections,
  searchRelays,
  userInbox,
  userMessaging,
  userOutbox,
} from "@welshman/util"
import type {Filter, RelaySelection, TrustedEvent} from "@welshman/util"
import {
  app,
  appConfig,
  followLists,
  fromApp,
  muteLists,
  network,
  profiles,
  relays,
  resolveRelays,
  sync,
  userRelays,
} from "src/engine/core"
import {env} from "src/engine/env"
import {shouldUnwrap} from "src/engine/state"
import {noteKinds, reactionKinds, repostKinds, RELAY_FEEDS} from "src/util/nostr"
import {CUSTOM_LIST_KINDS} from "src/domain"

// Utils

// A load that only makes sense signed in: its relay selections all resolve through the user, so
// there's nothing to ask for and nowhere to ask when nobody is.
const withUser =
  <T>(fn: ($user: User) => Promise<T>) =>
  async () => {
    const $user = app.get().user

    return $user ? fn($user) : undefined
  }

export const addSinceToFilter = (filter: Filter, overlap = int(HOUR)) => {
  const limit = 50
  const events = app.get().repository.query([{...filter, limit}])

  // If we only have a few events, it won't hurt to re-fetch everything. This can happen when
  // we fetch notifications with a limit of 1, giving us just a handful of events without pulling
  // the full dataset.
  const since =
    events.length < limit ? EPOCH : max(events.map(e => e.created_at).concat(EPOCH)) - overlap

  return {...filter, since}
}

export const pullConservatively = async ({relays: urls, filters}: AppSyncOpts) => {
  // hasNegentropy loads the relay's nip-11 document now, so it's async and it rejects
  const negentropy = await Promise.all(
    urls.map(url =>
      relays
        .get()
        .hasNegentropy(url)
        .catch(() => false),
    ),
  )

  const smart = urls.filter((_, i) => negentropy[i])
  const dumb = urls.filter((_, i) => !negentropy[i])
  const promises = [sync.get().pull({relays: smart, filters})]

  // Since pulling from relays without negentropy is expensive, limit how many
  // duplicates we repeatedly download
  if (dumb.length > 0) {
    const events = sortBy(e => -e.created_at, app.get().repository.query(filters))

    if (events.length > 100) {
      filters = filters.map(assoc("since", events[100]!.created_at))
    }

    promises.push(sync.get().pull({relays: dumb, filters}))
  }

  return Promise.all(promises)
}

export type DeriveEventOptions = {
  relays?: string[]
}

export const deriveEvent = (idOrAddress: string, {relays: hints = []}: DeriveEventOptions = {}) => {
  let attempted = false

  const filters = getIdFilters([idOrAddress])

  // Relay selection is asynchronous now, so this fires a tick after we notice the event is
  // missing rather than inline with the first store update
  const loadEvent = async () => {
    const selections: RelaySelection[] = relaySelections(hints)

    if (Address.isAddress(idOrAddress)) {
      selections.push(inbox(Address.from(idOrAddress).pubkey))
    }

    const urls = await resolveRelays(selections, {
      limit: Math.max(hints.length, appConfig.relayLimit),
    })

    await network.get().load({filters, relays: urls})
  }

  return derived(
    // The Events plugin has no includeDeleted option, and deleted events still have to
    // render (as a tombstone), so this reads the repository directly
    fromApp($app => deriveEvents({repository: $app.repository, filters, includeDeleted: true})),
    (events: TrustedEvent[]) => {
      if (!attempted && events.length === 0) {
        attempted = true

        loadEvent().catch(noop)
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
    load: debounce(500, async (term: string) => {
      if (term.length <= 2 || !shouldLoad(term)) {
        return
      }

      const start = Date.now()

      loading.set(true)

      try {
        // Search relays only. A `search` filter sent to a relay without nip-50 comes back as
        // an unfiltered dump of profiles, so this must not fall back to the default relays.
        const urls = await resolveRelays([searchRelays()])

        await network.get().request({
          autoClose: true,
          relays: urls,
          filters: [{kinds: [0], search: term, limit: 100}],
          onEvent,
        })
      } finally {
        await sleep(Math.min(1000, Date.now() - start))

        loading.set(false)
      }
    }),
  }
}

export const loadPubkeys = async (pubkeys: string[]) => {
  // Load slowly to avoid congestion and messing up relay selections for profiles.
  for (const pubkeyChunk of chunk(50, pubkeys)) {
    await sleep(300)

    for (const pubkey of pubkeyChunk) {
      // Loaders reject rather than swallowing failures now, and nothing awaits these
      profiles.get().load(pubkey).catch(noop)
      followLists.get().load(pubkey).catch(noop)
      muteLists.get().load(pubkey).catch(noop)
    }
  }
}

// Notifications

export const getNotificationKinds = () =>
  without(env.ENABLE_ZAPS ? [] : [9735], [
    ...noteKinds,
    ...reactionKinds,
    ...repostKinds,
    POLL_RESPONSE,
  ])

export const loadNotifications = withUser(async $user => {
  const filter = {kinds: getNotificationKinds(), "#p": [$user.pubkey]}

  return pullConservatively({
    relays: await resolveRelays([userInbox()]),
    filters: [addSinceToFilter(filter, int(WEEK))],
  })
})

export const listenForNotifications = withUser(async $user => {
  const filter = {kinds: getNotificationKinds(), "#p": [$user.pubkey]}
  const urls = await resolveRelays([userInbox()])

  // Left open on purpose; the Network plugin aborts it when the app is torn down
  network.get().request({relays: urls, filters: [addSinceToFilter(filter)]})
})

// Other user data

export const loadLabels = async (authors: string[]) =>
  network.get().load({
    relays: await resolveRelays(authors.map(author => outbox(author))),
    filters: [addSinceToFilter({kinds: [LABEL], authors, "#L": ["#t"]})],
  })

export const loadDeletes = withUser(async $user =>
  network.get().load({
    relays: await userRelays(),
    filters: [addSinceToFilter({kinds: [DELETE], authors: [$user.pubkey]})],
  }),
)

export const loadFeedsAndLists = withUser(async $user =>
  network.get().load({
    relays: await userRelays(),
    filters: [
      addSinceToFilter({
        kinds: [FEED, FEEDS, NAMED_BOOKMARKS, RELAY_FEEDS, ...CUSTOM_LIST_KINDS],
        authors: [$user.pubkey],
      }),
    ],
  }),
)

export const loadMessages = withUser(async $user => {
  if (!shouldUnwrap.get()) {
    return
  }

  const [inboxUrls, outboxUrls, messagingUrls] = await Promise.all([
    resolveRelays([userInbox()]),
    userRelays(),
    resolveRelays([userMessaging()]),
  ])

  await Promise.all([
    pullConservatively({
      relays: inboxUrls,
      filters: [{kinds: [DEPRECATED_DIRECT_MESSAGE], "#p": [$user.pubkey]}],
    }),
    pullConservatively({
      relays: outboxUrls,
      filters: [{kinds: [DEPRECATED_DIRECT_MESSAGE], authors: [$user.pubkey]}],
    }),
    pullConservatively({
      relays: messagingUrls,
      filters: [{kinds: [WRAP], "#p": [$user.pubkey]}],
    }),
  ])
})

// Stays synchronous so callers can unsubscribe on destroy; relay selection resolves in the
// background, and a request whose signal already aborted never opens a socket.
export const listenForMessages = () => {
  const controller = new AbortController()
  const $user = app.get().user

  if ($user && shouldUnwrap.get()) {
    const listen = async (selections: RelaySelection[], filters: Filter[]) =>
      network.get().request({
        signal: controller.signal,
        relays: await resolveRelays(selections),
        filters,
      })

    listen([userInbox()], [{kinds: [DEPRECATED_DIRECT_MESSAGE], "#p": [$user.pubkey]}]).catch(noop)
    listen([userOutbox()], [{kinds: [DEPRECATED_DIRECT_MESSAGE], authors: [$user.pubkey]}]).catch(
      noop,
    )
    listen([userMessaging()], [{kinds: [WRAP], "#p": [$user.pubkey]}]).catch(noop)
  }

  return () => controller.abort()
}
