import Fuse from "fuse.js"
import {derived, readable, writable} from "svelte/store"
import type {Readable} from "svelte/store"
import {
  cached,
  call,
  first,
  groupBy,
  identity,
  isPojo,
  max,
  noop,
  now,
  on,
  parseJson,
  pushToMapKey,
  remove,
  simpleCache,
  sort,
  sortBy,
  tryCatch,
  uniq,
} from "@welshman/lib"
import type {Maybe} from "@welshman/lib"
import {
  makeAuthorFeed,
  makeScopeFeed,
  makeIntersectionFeed,
  makeKindFeed,
  Scope,
} from "@welshman/feeds"
import type {RelayMessage, RequestOptions} from "@welshman/net"
import {LOCAL_RELAY_URL, SocketEvent} from "@welshman/net"
import {Nip01Signer} from "@welshman/signer"
import {
  deriveItems,
  deriveItemsByKey,
  localStorageProvider,
  synced,
  withGetter,
} from "@welshman/store"
import type {SignedEvent, TrustedEvent, HashedEvent} from "@welshman/util"
import {
  APP_DATA,
  DEPRECATED_DIRECT_MESSAGE,
  DIRECT_MESSAGE,
  FEED,
  HANDLER_INFORMATION,
  HANDLER_RECOMMENDATION,
  LABEL,
  NAMED_BOOKMARKS,
  getAddress,
  getIdAndAddress,
  getIdFilters,
  getIdentifier,
  getPow,
  hexTags,
  relayTags,
  tagSpec,
  tagValue,
  tagValues,
} from "@welshman/util"
import type {FeedListReader, FollowListReader} from "@welshman/domain"
import {AppData} from "@welshman/domain"
import type {AppPolicy, IApp} from "@welshman/app"
import {
  Domain,
  FeedLists,
  FollowLists,
  MuteLists,
  PinLists,
  Plaintext,
  Profiles,
  User,
  Wot,
  WotScope,
} from "@welshman/app"
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
  userListKind,
} from "src/domain"
import type {UserListReader} from "src/domain"
import type {AnonymousUserState, Channel, SessionWithMeta} from "src/engine/model"
import {getAncestors} from "src/engine/utils"
import {
  app,
  appConfig,
  appPolicies,
  deriveEvents,
  deriveUserItem,
  fromApp,
  network,
  pubkey,
  session,
  signer,
} from "src/engine/core"
import {env} from "src/engine/env"
import {SearchHelper, ensureProto} from "src/util/misc"
import {noteKinds, appDataKeys, RELAY_FEEDS} from "src/util/nostr"

export {env}

export const sessionWithMeta = withGetter(derived(session, $s => $s as SessionWithMeta))

export const hasNip44 = derived(signer, $signer => Boolean($signer?.nip44))

export const anonymous = withGetter(writable<AnonymousUserState>({follows: [], relays: []}))

export const shouldUnwrap = withGetter(
  synced<boolean>({
    key: "shouldUnwrap",
    storage: localStorageProvider,
    defaultValue: false,
  }),
)

// Plaintext

export const ensureMessagePlaintext = async (e: TrustedEvent) => {
  if (!e.content) return undefined

  const $app = app.get()
  const $user = $app.user

  if (!$user) return undefined

  const recipient = tagValue(hexTags("p"), e.tags)
  const other = e.pubkey === $user.pubkey ? recipient : e.pubkey

  if (!other) return undefined

  return $app
    .use(Plaintext)
    .ensure(e.content, () => $user.signer.nip04.decrypt(other, e.content))
    .catch(() => undefined)
}

// Tracker

export const deriveRelaysForEvent = (event: TrustedEvent) =>
  fromApp($app => {
    const urls = new Set(remove(LOCAL_RELAY_URL, Array.from($app.tracker.getRelays(event.id))))

    return readable(urls, set => {
      const unsubscribers = [
        on($app.tracker, "add", (id: string, url: string) => {
          if (id === event.id && url !== LOCAL_RELAY_URL) {
            urls.add(url)
            set(urls)
          }
        }),
        on($app.tracker, "remove", (id: string, url: string) => {
          if (id === event.id && url !== LOCAL_RELAY_URL) {
            urls.delete(url)
            set(urls)
          }
        }),
      ]

      return () => unsubscribers.forEach(call)
    })
  })

// Settings

export const defaultSettings = {
  relay_limit: 3,
  default_zap: 21,
  show_media: true,
  show_link_previews: true,
  send_delay: 0, // undo send delay in ms
  pow_difficulty: 0,
  muted_words: [], // Deprecated
  hide_sensitive: true,
  report_analytics: true,
  min_wot_score: 0,
  min_pow_difficulty: 0,
  enable_client_tag: false,
  auto_authenticate2: true,
  note_actions: ["zaps", "replies", "reactions", "reposts", "recommended_apps"],
  upload_type: "blossom",
  imgproxy_url: "",
  dufflepud_url: env.DUFFLEPUD_URL,
  platform_zap_split: env.PLATFORM_ZAP_SPLIT,
}

export const settingsEvents = deriveEvents([{kinds: [APP_DATA]}])

export const userSettingsEvent = derived([pubkey, settingsEvents], ([$pubkey, $settingsEvents]) =>
  $settingsEvents.find(e => e.pubkey === $pubkey && getIdentifier(e) === appDataKeys.USER_SETTINGS),
)

const plaintextByCiphertext = fromApp($app => $app.use(Plaintext).index.$)

const decryptingSettings = new Set<string>()

const decryptSettings = ($app: IApp, event: TrustedEvent) => {
  if (decryptingSettings.has(event.content)) return

  decryptingSettings.add(event.content)

  Promise.resolve($app.use(Domain).reader(AppData)(event))
    .catch(noop)
    .finally(() => decryptingSettings.delete(event.content))
}

export const userSettingsPlaintext: Readable<Maybe<string>> = derived(
  [app, plaintextByCiphertext, userSettingsEvent],
  ([$app, $plaintext, $event]) => {
    const content = $event?.content

    if (!content) return undefined

    const plaintext = $plaintext.get(content)

    if (plaintext !== undefined) return plaintext

    if (isPojo(parseJson(content))) return content

    decryptSettings($app, $event)

    return undefined
  },
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

  if (!base || !url || base.includes("coracle-imgproxy")) {
    return url
  }

  url = url.split("?")[0]

  if (url.match(/gif$/i)) {
    return url
  }

  try {
    return `${ensureProto(base)}/x/s:${w}:${h}/${btoa(url)}`
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

export const userFollowList: Readable<Maybe<FollowListReader>> = deriveUserItem(FollowLists)

export const userFollows = withGetter(
  derived([pubkey, userFollowList, anonymous], ([$pubkey, $followList, $anon]) =>
    $pubkey
      ? new Set($followList?.pubkeys() || [])
      : new Set(tagValues(hexTags("p"), $anon.follows)),
  ),
)

const userMuteList = deriveUserItem(MuteLists)

export const userMutedPubkeys = derived(userMuteList, l => new Set(l?.pubkeys() || []))

export const userMutedEvents = derived(
  userMuteList,
  l => new Set(tagValues(tagSpec(["a", "e"]), l?.tags() || [])),
)

export const userMutedWords = derived(
  userMuteList,
  l => new Set(tagValues(tagSpec("word"), l?.tags() || [])),
)

export const userMutedTopics = derived(
  userMuteList,
  l => new Set(tagValues(tagSpec("t"), l?.tags() || [])),
)

const userPinList = deriveUserItem(PinLists)

export const userPins = derived(userPinList, l => new Set(l?.ids() || []))

export const isEventMuted = withGetter(
  derived(
    [
      app,
      userMutedEvents,
      userMutedPubkeys,
      userMutedWords,
      userMutedTopics,
      userFollows,
      userSettings,
      pubkey,
    ],
    ([
      $app,
      $userMutedEvents,
      $userMutedPubkeys,
      $userMutedWords,
      $userMutedTopics,
      $userFollows,
      $userSettings,
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

          if (tagValues(tagSpec("t"), e.tags).some(t => $userMutedTopics.has(t))) {
            return true
          }

          if (regex) {
            if (e.content?.toLowerCase().match(regex)) return true
            if ($app.use(Profiles).display(e.pubkey).get().toLowerCase().match(regex)) return true
            if (tryCatch(() => $app.use(Profiles).get(e.pubkey)?.nip05()?.match(regex))) return true
          }

          if (strict || $userFollows.has(e.pubkey)) return false

          const wotScore = $app.use(Wot).score(e.pubkey, WotScope.Follows).get()
          const okWot = wotScore >= minWot
          const okPow = getPow(e) > minPow

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

export const getSeenAt = derived([checked], ([$checked]) => (path: string, event: TrustedEvent) => {
  const ts = max([$checked[path], $checked[path.split("/")[0] + "/*"], $checked["*"]])

  if (ts >= event.created_at) return ts

  return 0
})

// Channels

export const getChannelId = (pubkeys: string[]) => sort(uniq(pubkeys)).join(",")

export const getChannelIdFromEvent = (event: TrustedEvent) =>
  getChannelId([event.pubkey, ...tagValues(hexTags("p"), event.tags)])

export const messages = deriveEvents([{kinds: [DEPRECATED_DIRECT_MESSAGE, DIRECT_MESSAGE]}])

export const channels = derived(
  [pubkey, messages, getSeenAt],
  ([$pubkey, $messages, $getSeenAt]) => {
    const channelsById: Record<string, Channel> = {}

    if (!$pubkey) {
      return []
    }

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

// Lists

export const listsById = fromApp($app =>
  deriveItemsByKey<PublishedUserList>({
    repository: $app.repository,
    getKey: list => list.event.id,
    filters: [{kinds: EDITABLE_LIST_KINDS}],
    eventToItem: (event: TrustedEvent) => (event.tags.length > 1 ? readUserList(event) : undefined),
  }),
)

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

export const feedsById = fromApp($app =>
  deriveItemsByKey<PublishedFeed>({
    repository: $app.repository,
    getKey: feed => feed.event.id,
    filters: [{kinds: [FEED]}],
    eventToItem: readFeed,
  }),
)

export const feeds = deriveItems(feedsById)

export const userFeeds = derived([feeds, pubkey], ([$feeds, $pubkey]: [PublishedFeed[], string]) =>
  $feeds.filter(feed => feed.event.pubkey === $pubkey),
)

export const defaultFeed = derived([userFollows, userFeeds], ([$userFollows, $userFeeds]) => {
  const baseDefinition =
    $userFollows?.size > 0 ? makeScopeFeed(Scope.Follows) : makeAuthorFeed(...env.DEFAULT_FOLLOWS)

  const definition = normalizeFeedDefinition(
    makeIntersectionFeed(baseDefinition, makeKindFeed(...noteKinds)),
  )

  return makeFeed({definition})
})

export const feedFavorites = fromApp($app => $app.use(FeedLists).all.$)

export const feedFavoritesByAddress = withGetter(
  derived(feedFavorites, $feedFavorites => {
    const $feedFavoritesByAddress = new Map<string, FeedListReader[]>()

    for (const list of $feedFavorites) {
      for (const address of list.addresses()) {
        pushToMapKey($feedFavoritesByAddress, address, list)
      }
    }

    return $feedFavoritesByAddress
  }),
)

export const userFeedFavorites: Readable<Maybe<FeedListReader>> = deriveUserItem(FeedLists)

export const userFavoritedFeeds = derived([app, userFeedFavorites], ([$app, $list]) =>
  ($list?.addresses() || [])
    .map(address => $app.repository.getEvent(address))
    .filter(identity)
    .map(readFeed),
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

export const listFeedsById = fromApp($app =>
  deriveItemsByKey<PublishedListFeed>({
    repository: $app.repository,
    getKey: feed => feed.event.id,
    filters: [{kinds: [NAMED_BOOKMARKS]}],
    eventToItem: async (event: TrustedEvent) =>
      event.tags.length > 1 ? mapListToFeed(await readUserList(event)) : undefined,
  }),
)

export const listFeeds = deriveItems(listFeedsById)

export const userListFeeds = derived(
  [listFeeds, pubkey],
  ([$listFeeds, $pubkey]: [PublishedListFeed[], string]) =>
    sortBy(
      l => l.title.toLowerCase(),
      $listFeeds.filter(feed => feed.list.event.pubkey === $pubkey),
    ),
)

const relayFeedListsByPubkey = fromApp($app =>
  deriveItemsByKey<UserListReader>({
    repository: $app.repository,
    getKey: list => list.event.pubkey,
    filters: [{kinds: [RELAY_FEEDS]}],
    eventToItem: $app.use(Domain).reader(userListKind(RELAY_FEEDS)),
  }),
)

export const relayFeedLists = deriveItems(relayFeedListsByPubkey)

export const userRelayFeedsList: Readable<Maybe<UserListReader>> = derived(
  [relayFeedLists, pubkey],
  ([$lists, $pubkey]: [UserListReader[], string]) =>
    $lists.find(list => list.event.pubkey === $pubkey),
)

export const userRelayFeeds = derived(userRelayFeedsList, $list =>
  tagValues(relayTags("relay"), $list?.tags() || []),
)

// Handlers

export const handlers = derived(deriveEvents([{kinds: [HANDLER_INFORMATION]}]), $events =>
  $events.flatMap(readHandlers),
)

export const handlersByKind = derived(handlers, $handlers =>
  groupBy(handler => handler.kind, $handlers),
)

export const recommendations = deriveEvents([{kinds: [HANDLER_RECOMMENDATION]}])

const getUserFollows = () => {
  const $app = app.get()
  const $pubkey = $app.user?.pubkey

  return $pubkey ? $app.use(Wot).follows($pubkey).get() : []
}

export const deriveRecommendations = simpleCache(([address]: [string]) => {
  myLoad({
    skipCache: true,
    relays: env.DEFAULT_RELAYS,
    filters: [
      {
        kinds: [HANDLER_RECOMMENDATION],
        authors: getUserFollows(),
        "#a": [address],
      },
    ],
  }).catch(noop)

  return derived(recommendations, $events => $events.filter(e => getHandlerAddress(e) === address))
})

export const deriveHandlersForKind = simpleCache(([kind]: [number]) => {
  myLoad({
    skipCache: true,
    relays: env.DEFAULT_RELAYS,
    filters: [
      {
        kinds: [HANDLER_RECOMMENDATION],
        authors: getUserFollows(),
        "#d": [String(kind)],
      },
      {
        kinds: [HANDLER_INFORMATION],
        "#k": [String(kind)],
      },
    ],
  }).catch(noop)

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

  myLoad({relays: env.DEFAULT_RELAYS, filters}).catch(noop)

  return derived(deriveEvents(filters), first)
})

// Collections

export const collections = derived(deriveEvents([{kinds: [LABEL], "#L": ["#t"]}]), readCollections)

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

const withCache = ({skipCache, ...options}: MyRequestOptions): RequestOptions =>
  skipCache ? options : {...options, relays: [...options.relays, LOCAL_RELAY_URL]}

export const myRequest = (options: MyRequestOptions) => network.get().request(withCache(options))

export const myLoad = (options: MyRequestOptions) => network.get().load(withCache(options))

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

  return User.require(app.get()).sign(template)
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

// Bootstrap

const noticeVerbs = ["NOTICE", "CLOSED", "OK", "NEG-MSG"]

const maxNoticesPerRelay = 100

const appPolicyNotices: AppPolicy = $app => {
  const unsubscribe = $app.pool.subscribe(socket => {
    const onReceive = (message: RelayMessage, url: string) => {
      if (noticeVerbs.includes(message[0])) {
        subscriptionNotices.update($notices => {
          const notices = $notices.get(url) || []
          const notice = {url, created_at: now(), notice: message}

          $notices.set(url, [...notices, notice].slice(-maxNoticesPerRelay))

          return $notices
        })
      }
    }

    socket.on(SocketEvent.Receive, onReceive)

    return () => socket.off(SocketEvent.Receive, onReceive)
  })

  return () => {
    unsubscribe()
    subscriptionNotices.set(new Map())
  }
}

appPolicies.push(appPolicyNotices)

export const syncAppConfig = () =>
  userSettings.subscribe($settings => {
    appConfig.autoAuthenticate = $settings.auto_authenticate2
    appConfig.dufflepudUrl = $settings.dufflepud_url
    appConfig.relayLimit = $settings.relay_limit
  })
