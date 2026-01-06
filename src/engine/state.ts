import {
  displayProfileByPubkey,
  ensurePlaintext,
  followListsByPubkey,
  profilesByPubkey,
  getNetwork,
  getPlaintext,
  getSession,
  getSigner,
  getUserWotScore,
  loadRelay,
  getMaxWot,
  userMuteList,
  plaintext,
  userPinList,
  sessions,
  pubkey,
  repository,
  session,
  setPlaintext,
  signer,
  tracker,
  appContext,
  wrapManager,
  shouldUnwrap,
  getFollows,
} from "@welshman/app"
import {makeAuthorFeed, makeScopeFeed, Scope} from "@welshman/feeds"
import {
  TaskQueue,
  groupBy,
  identity,
  now,
  pushToMapKey,
  simpleCache,
  cached,
  sort,
  uniq,
  prop,
  sortBy,
  max,
  always,
  tryCatch,
  first,
  remove,
  call,
  on,
} from "@welshman/lib"
import {routerContext} from "@welshman/router"
import type {Socket, RequestOptions} from "@welshman/net"
import {
  SocketEvent,
  Pool,
  load,
  request,
  makeSocketPolicyAuth,
  defaultSocketPolicies,
  LOCAL_RELAY_URL,
} from "@welshman/net"
import {Nip01Signer} from "@welshman/signer"
import {
  deriveEvents,
  deriveItemsByKey,
  deriveItems,
  synced,
  localStorageProvider,
  withGetter,
  sync,
} from "@welshman/store"
import type {
  EventTemplate,
  PublishedList,
  SignedEvent,
  TrustedEvent,
  HashedEvent,
  StampedEvent,
} from "@welshman/util"
import {
  APP_DATA,
  DIRECT_MESSAGE,
  FEED,
  FEEDS,
  FOLLOWS,
  HANDLER_INFORMATION,
  HANDLER_RECOMMENDATION,
  LABEL,
  MUTES,
  NAMED_BOOKMARKS,
  PROFILE,
  RELAYS,
  MESSAGING_RELAYS,
  asDecryptedEvent,
  getAddress,
  getAddressTagValues,
  getIdentifier,
  getListTags,
  getPubkeyTagValues,
  getTagValue,
  getTagValues,
  makeList,
  normalizeRelayUrl,
  readList,
  getAncestors,
  getTag,
  getIdAndAddress,
  getIdFilters,
} from "@welshman/util"
import Fuse from "fuse.js"
import {getPow} from "nostr-tools/nip13"
import type {PublishedFeed, PublishedListFeed, PublishedUserList} from "src/domain"
import {
  CollectionSearch,
  EDITABLE_LIST_KINDS,
  UserListSearch,
  displayFeed,
  getHandlerAddress,
  mapListToFeed,
  readCollections,
  readFeed,
  readHandlers,
  readUserList,
  subscriptionNotices,
  makeFeed,
  normalizeFeedDefinition,
} from "src/domain"
import type {AnonymousUserState, Channel, SessionWithMeta} from "src/engine/model"
import {
  RelaysStorageAdapter,
  HandlesStorageAdapter,
  ZappersStorageAdapter,
  PlaintextStorageAdapter,
  TrackerStorageAdapter,
  WrapManagerStorageAdapter,
  EventsStorageAdapter,
  initStorage,
} from "src/engine/storage"
import {SearchHelper, fromCsv, parseJson, ensureProto} from "src/util/misc"
import {appDataKeys} from "src/util/nostr"
import {readable, derived, writable} from "svelte/store"

export const env = {
  CLIENT_ID: import.meta.env.VITE_CLIENT_ID as string,
  CLIENT_NAME: import.meta.env.VITE_CLIENT_NAME as string,
  DEFAULT_FOLLOWS: fromCsv(import.meta.env.VITE_DEFAULT_FOLLOWS) as string,
  DEFAULT_RELAYS: fromCsv(import.meta.env.VITE_DEFAULT_RELAYS).map(normalizeRelayUrl) as string[],
  INDEXER_RELAYS: fromCsv(import.meta.env.VITE_INDEXER_RELAYS).map(normalizeRelayUrl) as string[],
  DUFFLEPUD_URL: import.meta.env.VITE_DUFFLEPUD_URL as string,
  DVM_RELAYS: fromCsv(import.meta.env.VITE_DVM_RELAYS).map(normalizeRelayUrl) as string[],
  ENABLE_MARKET: JSON.parse(import.meta.env.VITE_ENABLE_MARKET) as boolean,
  ENABLE_ZAPS: JSON.parse(import.meta.env.VITE_ENABLE_ZAPS) as boolean,
  BLUR_CONTENT: JSON.parse(import.meta.env.VITE_BLUR_CONTENT) as boolean,
  BLOSSOM_URLS: fromCsv(import.meta.env.VITE_BLOSSOM_URLS) as string[],
  ONBOARDING_LISTS: fromCsv(import.meta.env.VITE_ONBOARDING_LISTS) as string[],
  PLATFORM_PUBKEY: import.meta.env.VITE_PLATFORM_PUBKEY as string,
  PLATFORM_ZAP_SPLIT: parseFloat(import.meta.env.VITE_PLATFORM_ZAP_SPLIT) as number,
  SEARCH_RELAYS: fromCsv(import.meta.env.VITE_SEARCH_RELAYS).map(normalizeRelayUrl) as string[],
  SIGNER_RELAYS: fromCsv(import.meta.env.VITE_SIGNER_RELAYS).map(normalizeRelayUrl) as string[],
  APP_URL: import.meta.env.VITE_APP_URL,
  APP_NAME: import.meta.env.VITE_APP_NAME,
  APP_LOGO: import.meta.env.VITE_APP_LOGO,
}

export const sessionWithMeta = withGetter(derived(session, $s => $s as SessionWithMeta))

export const hasNip44 = derived(signer, $signer => Boolean($signer?.nip44))

export const anonymous = withGetter(writable<AnonymousUserState>({follows: [], relays: []}))

// Plaintext

export const ensureMessagePlaintext = async (e: TrustedEvent) => {
  if (!e.content) return undefined
  if (!getPlaintext(e)) {
    const recipient = getTagValue("p", e.tags)
    const session = getSession(e.pubkey) || getSession(recipient)
    const other = e.pubkey === session?.pubkey ? recipient : e.pubkey
    const signer = getSigner(session)

    if (signer) {
      const result = await signer.nip04.decrypt(other, e.content)

      if (result) {
        setPlaintext(e, result)
      }
    }
  }

  return getPlaintext(e)
}

// Decrypt stuff as it comes in

const decrypter = new TaskQueue<TrustedEvent>({
  batchSize: 10,
  processItem: ensurePlaintext,
})

const decryptKinds = [APP_DATA, FOLLOWS, MUTES]

repository.on("update", ({added}: {added: TrustedEvent[]}) => {
  for (const event of added) {
    if (decryptKinds.includes(event.kind)) {
      decrypter.push(event)
    }
  }
})

// Tracker

export const deriveRelaysForEvent = (event: TrustedEvent) => {
  const urls = new Set(remove(LOCAL_RELAY_URL, Array.from(tracker.getRelays(event.id))))

  return readable(urls, set => {
    const unsubscribers = [
      on(tracker, "add", (id: string, url: string) => {
        if (id === event.id && url !== LOCAL_RELAY_URL) {
          urls.add(url)
          set(urls)
        }
      }),
      on(tracker, "remove", (id: string, url: string) => {
        if (id === event.id && url !== LOCAL_RELAY_URL) {
          urls.delete(url)
          set(urls)
        }
      }),
    ]

    return () => unsubscribers.forEach(call)
  })
}

// Settings

export const defaultSettings = {
  relay_limit: 3,
  default_zap: 21,
  show_media: true,
  send_delay: 0, // undo send delay in ms
  pow_difficulty: 0,
  muted_words: [], // Deprecated
  hide_sensitive: true,
  report_analytics: true,
  min_wot_score: 0,
  min_pow_difficulty: 0,
  enable_client_tag: false,
  auto_authenticate2: true,
  note_actions: ["zaps", "replies", "reactions", "recommended_apps"],
  upload_type: "blossom",
  imgproxy_url: "",
  dufflepud_url: env.DUFFLEPUD_URL,
  platform_zap_split: env.PLATFORM_ZAP_SPLIT,
}

export const settingsEvents = deriveEvents({repository, filters: [{kinds: [APP_DATA]}]})

export const userSettingsEvent = derived([pubkey, settingsEvents], ([$pubkey, $settingsEvents]) =>
  $settingsEvents.find(e => e.pubkey === $pubkey && getIdentifier(e) === appDataKeys.USER_SETTINGS),
)

export const userSettingsPlaintext = derived(
  [plaintext, userSettingsEvent],
  ([$plaintext, $userSettingsEvent]) => $plaintext[$userSettingsEvent?.id],
)

export const userSettings = withGetter<typeof defaultSettings>(
  derived(userSettingsPlaintext, $userSettingsPlaintext => {
    const overrides = parseJson($userSettingsPlaintext) || {}

    return {...defaultSettings, ...overrides}
  }),
)

export function getSetting<T = any>(k: string): T {
  return userSettings.get()[k] as T
}

export const imgproxy = (url: string, {w = 640, h = 1024} = {}) => {
  const base = getSetting("imgproxy_url")

  if (!base || !url || url.match("gif$")) {
    return url
  }

  url = url.split("?")[0]

  try {
    return base && url ? `${ensureProto(base)}/x/s:${w}:${h}/${btoa(url)}` : url
  } catch (e) {
    return url
  }
}

export const dufflepud = (path: string) => {
  const base = getSetting("dufflepud_url")

  if (!base) {
    throw new Error("Dufflepud is not enabled")
  }

  return `${base}/${path}`
}

// User follows/mutes/network

export const getMinWot = () => getSetting("min_wot_score") / getMaxWot()

export const userFollowList = derived(
  [followListsByPubkey, pubkey, anonymous],
  ([$m, $pk, $anon]) => {
    return $pk ? $m.get($pk) : makeList({kind: FOLLOWS, publicTags: $anon.follows})
  },
)

export const userFollows = withGetter(
  derived(userFollowList, l => new Set(getPubkeyTagValues(getListTags(l)))),
)

export const userNetwork = derived(userFollowList, l => getNetwork(l.event.pubkey))

export const userMutedPubkeys = derived(
  userMuteList,
  l => new Set(getTagValues("p", getListTags(l))),
)

export const userMutedEvents = derived(
  userMuteList,
  l => new Set(getTagValues(["a", "e"], getListTags(l))),
)

export const userMutedWords = derived(
  userMuteList,
  l => new Set(getTagValues("word", getListTags(l))),
)

export const userMutedTopics = derived(
  userMuteList,
  l => new Set(getTagValues("t", getListTags(l))),
)

export const userPins = derived(userPinList, l => new Set(getTagValues(["e"], getListTags(l))))

export const isEventMuted = withGetter(
  derived(
    [
      userMutedEvents,
      userMutedPubkeys,
      userMutedWords,
      userMutedTopics,
      userFollows,
      userSettings,
      profilesByPubkey,
      pubkey,
    ],
    ([
      $userMutedEvents,
      $userMutedPubkeys,
      $userMutedWords,
      $userMutedTopics,
      $userFollows,
      $userSettings,
      $profilesByPubkey,
      $pubkey,
    ]) => {
      const words = [...$userSettings.muted_words, ...$userMutedWords]
      const minWot = $userSettings.min_wot_score
      const minPow = $userSettings.min_pow_difficulty
      const regex =
        words.length > 0
          ? new RegExp(`\\b(${words.map(w => w.toLowerCase().trim()).join("|")})\\b`)
          : null

      return cached({
        maxSize: 5000,
        getKey: ([e, strict = false]: [e: HashedEvent, strict?: boolean]) => `${e.id}:${strict}`,
        getValue: ([e, strict = false]: [e: HashedEvent, strict?: boolean]) => {
          if (!$pubkey || !e.pubkey || $pubkey === e.pubkey) return false

          if ($userMutedPubkeys.has(e.pubkey)) {
            return true
          }

          const {roots, replies} = getAncestors(e)

          if ([...getIdAndAddress(e), ...roots, ...replies].some(x => $userMutedEvents.has(x))) {
            return true
          }

          if (getTagValues("t", e.tags).some(t => $userMutedTopics.has(t))) {
            return true
          }

          if (regex) {
            if (e.content?.toLowerCase().match(regex)) return true
            if (displayProfileByPubkey(e.pubkey).toLowerCase().match(regex)) return true
            if (tryCatch(() => $profilesByPubkey.get(e.pubkey)?.nip05?.match(regex))) return true
          }

          if (strict || $userFollows.has(e.pubkey)) return false

          const wotScore = getUserWotScore(e.pubkey)
          const okWot = wotScore >= minWot
          const powDifficulty = Number(getTag("nonce", e.tags)?.[2] || "0")
          const isValidPow = getPow(e.id) >= powDifficulty
          const okPow = isValidPow && powDifficulty > minPow

          return !okWot && !okPow
        },
      })
    },
  ),
)

// Read receipts

export const checked = synced<Record<string, number>>({
  key: "checked",
  defaultValue: {},
  storage: localStorageProvider,
})

export const deriveChecked = (key: string) => derived(checked, prop(key))

export const getSeenAt = derived([checked], ([$checked]) => (path: string, event: TrustedEvent) => {
  const ts = max([$checked[path], $checked[path.split("/")[0] + "/*"], $checked["*"]])

  if (ts >= event.created_at) return ts

  return 0
})

// Channels

export const getChannelId = (pubkeys: string[]) => sort(uniq(pubkeys)).join(",")

export const getChannelIdFromEvent = (event: TrustedEvent) =>
  getChannelId([event.pubkey, ...getPubkeyTagValues(event.tags)])

export const messages = deriveEvents({repository, filters: [{kinds: [4, DIRECT_MESSAGE]}]})

export const channels = derived(
  [pubkey, messages, getSeenAt],
  ([$pubkey, $messages, $getSeenAt]) => {
    const channelsById: Record<string, Channel> = {}

    for (const e of $messages) {
      const id = getChannelIdFromEvent(e)

      if (!id.includes($pubkey)) {
        continue
      }

      const chan = channelsById[id] || {
        id,
        last_sent: 0,
        last_received: 0,
        last_checked: 0,
        messages: [],
      }

      chan.messages.push(e)
      chan.last_checked = Math.max(chan.last_checked, $getSeenAt("channels/" + id, e))

      if (e.pubkey === $pubkey) {
        chan.last_sent = Math.max(chan.last_sent, e.created_at)
      } else {
        chan.last_received = Math.max(chan.last_received, e.created_at)
      }

      channelsById[id] = chan
    }

    return sortBy(c => -Math.max(c.last_sent, c.last_received), Object.values(channelsById))
  },
)

export const channelHasNewMessages = (channel: Channel) =>
  channel.last_received > Math.max(channel.last_sent, channel.last_checked)

export const hasNewMessages = derived(channels, $channels => $channels.some(channelHasNewMessages))

export const forceRelays = (relays: string[], forceRelays: string[]) =>
  forceRelays.length > 0 ? forceRelays : relays

export const withRelays = (relays: string[], otherRelays: string[]) =>
  uniq([...relays, ...otherRelays])

export const withIndexers = (relays: string[]) => withRelays(relays, env.INDEXER_RELAYS)

// Lists

export const listsById = deriveItemsByKey({
  repository,
  getKey: list => list.event.id,
  filters: [{kinds: EDITABLE_LIST_KINDS}],
  eventToItem: (event: TrustedEvent) => (event.tags.length > 1 ? readUserList(event) : null),
})

export const lists = deriveItems(listsById)

export const userLists = derived(
  [lists, pubkey],
  ([$lists, $pubkey]: [PublishedUserList[], string]) =>
    sortBy(
      l => l.title.toLowerCase(),
      $lists.filter(list => list.event.pubkey === $pubkey),
    ),
)

export const listSearch = derived(lists, $lists => new UserListSearch($lists))

// Feeds

export const feedsById = deriveItemsByKey({
  repository,
  getKey: feed => feed.event.id,
  filters: [{kinds: [FEED]}],
  eventToItem: readFeed,
})

export const feeds = deriveItems(feedsById)

export const userFeeds = derived([feeds, pubkey], ([$feeds, $pubkey]: [PublishedFeed[], string]) =>
  $feeds.filter(feed => feed.event.pubkey === $pubkey),
)

export const defaultFeed = derived([userFollows, userFeeds], ([$userFollows, $userFeeds]) => {
  let definition
  if ($userFollows?.size > 0) {
    definition = makeScopeFeed(Scope.Follows)
  } else {
    definition = makeAuthorFeed(...env.DEFAULT_FOLLOWS)
  }

  return makeFeed({definition: normalizeFeedDefinition(definition)})
})

export const feedFavoriteEvents = deriveEvents({repository, filters: [{kinds: [FEEDS]}]})

export const feedFavorites = derived(
  [plaintext, feedFavoriteEvents],
  ([$plaintext, $feedFavoriteEvents]) =>
    $feedFavoriteEvents.map(event =>
      readList(
        asDecryptedEvent(event, {
          content: $plaintext[event.id],
        }),
      ),
    ),
)

export const feedFavoritesByAddress = withGetter(
  derived(feedFavorites, $feedFavorites => {
    const $feedFavoritesByAddress = new Map<string, PublishedList[]>()

    for (const list of $feedFavorites) {
      for (const address of getAddressTagValues(getListTags(list))) {
        pushToMapKey($feedFavoritesByAddress, address, list)
      }
    }

    return $feedFavoritesByAddress
  }),
)

export const userFeedFavorites = derived(
  [feedFavorites, pubkey],
  ([$lists, $pubkey]: [PublishedList[], string]) =>
    $lists.find(list => list.event.pubkey === $pubkey),
)

export const userFavoritedFeeds = derived(userFeedFavorites, $list =>
  getAddressTagValues(getListTags($list)).map(repository.getEvent).filter(identity).map(readFeed),
)

export class FeedSearch extends SearchHelper<PublishedFeed, string> {
  getSearch = () => {
    const $feedFavoritesByAddress = feedFavoritesByAddress.get()
    const getScore = feed => $feedFavoritesByAddress.get(getAddress(feed.event))?.length || 0
    const options = this.options.map(feed => ({feed, score: getScore(feed)}))
    const fuse = new Fuse(options, {
      keys: ["feed.title", "feed.description"],
      shouldSort: false,
      includeScore: true,
    })

    return (term: string) => {
      if (!term) {
        return sortBy(item => -item.score, options).map(item => item.feed)
      }

      return sortBy(
        (r: any) => r.score - Math.pow(Math.max(0, r.item.score), 1 / 100),
        fuse.search(term),
      ).map((r: any) => r.item.feed)
    }
  }

  getValue = (option: PublishedFeed) => getAddress(option.event)

  displayValue = (address: string) => displayFeed(this.getOption(address))
}

export const feedSearch = derived(feeds, $feeds => new FeedSearch($feeds))

export const listFeedsById = deriveItemsByKey({
  repository,
  getKey: feed => feed.event.id,
  filters: [{kinds: [NAMED_BOOKMARKS]}],
  eventToItem: (event: TrustedEvent) =>
    event.tags.length > 1 ? mapListToFeed(readUserList(event)) : undefined,
})

export const listFeeds = deriveItems(listFeedsById)

export const userListFeeds = derived(
  [listFeeds, pubkey],
  ([$listFeeds, $pubkey]: [PublishedListFeed[], string]) =>
    sortBy(
      l => l.title.toLowerCase(),
      $listFeeds.filter(feed => feed.list.event.pubkey === $pubkey),
    ),
)

// Handlers

export const handlers = derived(
  deriveEvents({repository, filters: [{kinds: [HANDLER_INFORMATION]}]}),
  $events => $events.flatMap(readHandlers),
)

export const handlersByKind = derived(handlers, $handlers =>
  groupBy(handler => handler.kind, $handlers),
)

export const recommendations = deriveEvents({
  repository,
  filters: [{kinds: [HANDLER_RECOMMENDATION]}],
})

export const deriveRecommendations = simpleCache(([address]: [string]) => {
  myLoad({
    skipCache: true,
    relays: env.DEFAULT_RELAYS,
    filters: [
      {
        kinds: [HANDLER_RECOMMENDATION],
        authors: getFollows(pubkey.get()),
        "#a": [address],
      },
    ],
  })

  return derived(recommendations, $events => $events.filter(e => getHandlerAddress(e) === address))
})

export const deriveHandlersForKind = simpleCache(([kind]: [number]) => {
  myLoad({
    skipCache: true,
    relays: env.DEFAULT_RELAYS,
    filters: [
      {
        kinds: [HANDLER_RECOMMENDATION],
        authors: getFollows(pubkey.get()),
        "#d": [String(kind)],
      },
      {
        kinds: [HANDLER_INFORMATION],
        "#k": [String(kind)],
      },
    ],
  })

  return derived([handlers, recommendations], ([$handlers, $recs]) =>
    sortBy(
      h => -h.recommendations.length,
      $handlers
        .filter(h => h.kind === kind)
        .map(h => ({
          ...h,
          recommendations: $recs.filter(e => getHandlerAddress(e) === getAddress(h.event)),
        })),
    ),
  )
})

export const deriveHandlerEvent = simpleCache(([address]: [string]) => {
  const filters = getIdFilters([address])

  myLoad({relays: env.DEFAULT_RELAYS, filters})

  return derived(deriveEvents({repository, filters}), first)
})

// Collections

export const collections = derived(
  deriveEvents({repository, filters: [{kinds: [LABEL], "#L": ["#t"]}]}),
  readCollections,
)

export const deriveCollections = pubkey =>
  derived(collections, $collections =>
    sortBy(
      f => f.name.toLowerCase(),
      $collections.filter(collection => collection.pubkey === pubkey),
    ),
  )

export const collectionSearch = derived(
  collections,
  $collections => new CollectionSearch($collections),
)

// Network

export type MyRequestOptions = RequestOptions & {
  skipCache?: boolean
}

export const myRequest = ({skipCache, ...options}: MyRequestOptions) => {
  if (!skipCache) {
    options.relays = [...options.relays, LOCAL_RELAY_URL]
  }

  return request(options)
}

export const myLoad = ({skipCache, ...options}: MyRequestOptions) => {
  if (!skipCache) {
    options.relays = [...options.relays, LOCAL_RELAY_URL]
  }

  return load(options)
}

export const sign = (
  template,
  opts: {anonymous?: boolean; sk?: string} = {},
): Promise<SignedEvent> => {
  if (opts.anonymous) {
    return Nip01Signer.ephemeral().sign(template)
  }

  if (opts.sk) {
    return Nip01Signer.fromSecret(opts.sk).sign(template)
  }

  return signer.get().sign(template)
}

export const getClientTags = () => {
  if (!getSetting("enable_client_tag")) {
    return []
  }

  const {CLIENT_NAME = "", CLIENT_ID} = env
  const tag = ["client", CLIENT_NAME]

  if (CLIENT_ID) {
    tag.push(CLIENT_ID)
  }

  return [tag]
}

export const addClientTags = <T extends Partial<EventTemplate>>({tags = [], ...event}: T) => ({
  ...event,
  tags: tags.filter(t => t[0] !== "client").concat(getClientTags()),
})

// Storage

let ready: Promise<any> = Promise.resolve()
let initialized = false

// Avoid initializing multiple times on hot reload
if (!initialized) {
  initialized = true
  const noticeVerbs = ["NOTICE", "CLOSED", "OK", "NEG-MSG"]
  const initialRelays = [
    ...env.DEFAULT_RELAYS,
    ...env.DVM_RELAYS,
    ...env.INDEXER_RELAYS,
    ...env.SEARCH_RELAYS,
  ]

  let autoAuthenticate = false

  defaultSocketPolicies.push(
    makeSocketPolicyAuth({
      sign: (event: StampedEvent) => signer.get()?.sign(event),
      shouldAuth: (socket: Socket) => autoAuthenticate,
    }),
  )

  // Configure app
  appContext.dufflepudUrl = env.DUFFLEPUD_URL

  // Configure router
  routerContext.getDefaultRelays = always(env.DEFAULT_RELAYS)
  routerContext.getIndexerRelays = always(env.INDEXER_RELAYS)
  routerContext.getSearchRelays = always(env.SEARCH_RELAYS)
  routerContext.getLimit = () => getSetting("relay_limit")

  // Sync current pubkey
  sync({
    key: "pubkey",
    store: pubkey,
    storage: localStorageProvider,
  })

  // Sync user sessions
  sync({
    key: "sessions",
    store: sessions,
    storage: localStorageProvider,
  })

  // Sync decrypt setting
  sync({
    key: "shouldUnwrap",
    store: shouldUnwrap,
    storage: localStorageProvider,
  })

  // Sync user settings
  userSettings.subscribe($settings => {
    autoAuthenticate = $settings.auto_authenticate2
    appContext.dufflepudUrl = getSetting("dufflepud_url")
  })

  // Monitor notices
  Pool.get().subscribe((socket: Socket) => {
    socket.on(SocketEvent.Receive, (message, url) => {
      if (noticeVerbs.includes(message[0])) {
        subscriptionNotices.update($notices => {
          pushToMapKey($notices, url, {url, created_at: now(), notice: message})

          return $notices
        })
      }
    })
  })

  ready = initStorage("coracle", 9, {
    relays: new RelaysStorageAdapter({name: "relays"}),
    handles: new HandlesStorageAdapter({name: "handles"}),
    zappers: new ZappersStorageAdapter({name: "zappers"}),
    plaintext: new PlaintextStorageAdapter({name: "plaintext"}),
    tracker: new TrackerStorageAdapter({name: "tracker", tracker}),
    wraps: new WrapManagerStorageAdapter({name: "wraps", wrapManager}),
    events: new EventsStorageAdapter({
      repository,
      name: "events",
      limit: 10_000,
      rankEvent: (e: TrustedEvent) => {
        const $sessions = sessions.get()
        const metaKinds = [PROFILE, FOLLOWS, MUTES, RELAYS, MESSAGING_RELAYS]

        if ($sessions[e.pubkey] || e.tags.some(t => $sessions[t[1]])) return 1
        if (metaKinds.includes(e.kind) && userFollows.get()?.has(e.pubkey)) return 1

        return 0
      },
    }),
  })

  ready.then(() => Promise.all(initialRelays.map(url => loadRelay(url))))
}

export {ready}
