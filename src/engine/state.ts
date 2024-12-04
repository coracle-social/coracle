import type {PartialSubscribeRequest} from "@welshman/app"
import {
  subscribe as baseSubscribe,
  db,
  displayProfileByPubkey,
  ensurePlaintext,
  followsByPubkey,
  freshness,
  getDefaultAppContext,
  getDefaultNetContext,
  getNetwork,
  getPlaintext,
  getSession,
  getSigner,
  getUserWotScore,
  handles,
  initStorage,
  loadRelay,
  makeRouter,
  maxWot,
  mutesByPubkey,
  plaintext,
  pubkey,
  publishThunk,
  relay,
  relays,
  repository,
  session,
  sessions,
  setPlaintext,
  signer,
  storageAdapters,
  tagPubkey,
  tracker,
  zappers,
} from "@welshman/app"
import * as Content from "@welshman/content"
import {
  Worker,
  ctx,
  groupBy,
  identity,
  now,
  ago,
  pushToMapKey,
  setContext,
  simpleCache,
  sort,
  take,
  tryCatch,
  uniq,
  uniqBy,
} from "@welshman/lib"
import type {Connection, PublishRequest, Target} from "@welshman/net"
import {
  Executor,
  AuthMode,
  Local,
  Multi,
  Relays,
  SubscriptionEvent,
  ConnectionEvent,
} from "@welshman/net"
import {Nip01Signer, Nip59} from "@welshman/signer"
import {deriveEvents, deriveEventsMapped, throttled, withGetter} from "@welshman/store"
import type {EventTemplate, PublishedList, SignedEvent, TrustedEvent} from "@welshman/util"
import {
  APP_DATA,
  DIRECT_MESSAGE,
  FEED,
  FEEDS,
  FOLLOWS,
  HANDLER_INFORMATION,
  HANDLER_RECOMMENDATION,
  LABEL,
  LOCAL_RELAY_URL,
  MUTES,
  NAMED_BOOKMARKS,
  SEEN_CONTEXT,
  SEEN_CONVERSATION,
  SEEN_GENERAL,
  Tags,
  WRAP,
  asDecryptedEvent,
  createEvent,
  getAddress,
  getAddressTagValues,
  getAncestorTagValues,
  getIdAndAddress,
  getIdFilters,
  getIdOrAddress,
  getIdentifier,
  getListTags,
  getPubkeyTagValues,
  getTagValues,
  isHashedEvent,
  makeList,
  normalizeRelayUrl,
  readList,
} from "@welshman/util"
import crypto from "crypto"
import Fuse from "fuse.js"
import {batch, doPipe, seconds, sleep} from "hurdak"
import {equals, partition, prop, sortBy, without} from "ramda"
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
} from "src/domain"
import type {AnonymousUserState, Channel, SessionWithMeta} from "src/engine/model"
import {OnboardingTask} from "src/engine/model"
import {sortEventsAsc} from "src/engine/utils"
import logger from "src/util/logger"
import {SearchHelper, fromCsv, parseJson} from "src/util/misc"
import {appDataKeys, isLike, metaKinds, noteKinds, reactionKinds, repostKinds} from "src/util/nostr"
import {derived, get, writable} from "svelte/store"

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
  IMGPROXY_URL: import.meta.env.VITE_IMGPROXY_URL as string,
  NIP96_URLS: fromCsv(import.meta.env.VITE_NIP96_URLS) as string[],
  BLOSSOM_URLS: fromCsv(import.meta.env.VITE_BLOSSOM_URLS) as string[],
  ONBOARDING_LISTS: fromCsv(import.meta.env.VITE_ONBOARDING_LISTS) as string[],
  PLATFORM_PUBKEY: import.meta.env.VITE_PLATFORM_PUBKEY as string,
  PLATFORM_RELAYS: fromCsv(import.meta.env.VITE_PLATFORM_RELAYS).map(normalizeRelayUrl) as string[],
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
    const recipient = Tags.fromEvent(e).get("p")?.value()
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

const pendingUnwraps = new Map<string, Promise<TrustedEvent>>()

export const ensureUnwrapped = async (event: TrustedEvent) => {
  if (event.kind !== WRAP) {
    return event
  }

  let rumor = repository.eventsByWrap.get(event.id)

  if (rumor) {
    return rumor
  }

  const pending = pendingUnwraps.get(event.id)

  if (pending) {
    return pending
  }

  // Decrypt by session
  const session = getSession(Tags.fromEvent(event).get("p")?.value())
  const signer = getSigner(session)

  if (signer) {
    try {
      const pending = Nip59.fromSigner(signer).unwrap(event as SignedEvent)

      pendingUnwraps.set(event.id, pending)
      rumor = await pending
    } catch (e) {
      // pass
    }
  }

  if (rumor && isHashedEvent(rumor)) {
    pendingUnwraps.delete(event.id)
    tracker.copy(event.id, rumor.id)
    relay.send("EVENT", rumor)
  }

  return rumor
}

// Unwrap/decrypt stuff as it comes in

const unwrapper = new Worker<TrustedEvent>({chunkSize: 10})

unwrapper.addGlobalHandler(async (event: TrustedEvent) => {
  if (event.kind === WRAP) {
    await ensureUnwrapped(event)
  } else {
    await ensurePlaintext(event)
  }
})

const decryptKinds = [SEEN_GENERAL, SEEN_CONTEXT, SEEN_CONVERSATION, APP_DATA, FOLLOWS, MUTES]

repository.on("update", ({added}: {added: TrustedEvent[]}) => {
  for (const event of added) {
    if (decryptKinds.includes(event.kind) && event.content && !getPlaintext(event)) {
      unwrapper.push(event)
    }

    if (event.kind === WRAP) {
      unwrapper.push(event)
    }
  }
})

// Settings

export const defaultSettings = {
  relay_limit: 5,
  default_zap: 21,
  show_media: true,
  send_delay: 0, // undo send delay in ms
  muted_words: [],
  hide_sensitive: true,
  report_analytics: true,
  min_wot_score: 0,
  enable_client_tag: false,
  auto_authenticate: false,
  note_actions: ["zaps", "replies", "reactions", "recommended_apps"],
  upload_type: "nip96",
  nip96_urls: env.NIP96_URLS.slice(0, 1),
  blossom_urls: env.BLOSSOM_URLS.slice(0, 1),
  imgproxy_url: env.IMGPROXY_URL,
  dufflepud_url: env.DUFFLEPUD_URL,
  platform_zap_split: env.PLATFORM_ZAP_SPLIT,
}

export const settingsEvents = deriveEvents(repository, {filters: [{kinds: [APP_DATA]}]})

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

export const getSetting = k => prop(k, userSettings.get())

export const imgproxy = (url: string, {w = 640, h = 1024} = {}) => {
  const base = getSetting("imgproxy_url")

  if (!url || url.match("gif$")) {
    return url
  }

  url = url.split("?")[0]

  try {
    return base && url ? `${base}/x/s:${w}:${h}/${btoa(url)}` : url
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

export const getMinWot = () => getSetting("min_wot_score") / maxWot.get()

export const userFollowList = derived([followsByPubkey, pubkey, anonymous], ([$m, $pk, $anon]) => {
  return $pk ? $m.get($pk) : makeList({kind: FOLLOWS, publicTags: $anon.follows})
})

export const userFollows = derived(userFollowList, l => new Set(getPubkeyTagValues(getListTags(l))))

export const userNetwork = derived(userFollowList, l => getNetwork(l.event.pubkey))

export const userMuteList = derived([mutesByPubkey, pubkey], ([$m, $pk]) => $m.get($pk))

export const userMutes = derived(
  userMuteList,
  l => new Set(getTagValues(["p", "e"], getListTags(l))),
)

export const isEventMuted = withGetter(
  derived(
    [userMutes, userFollows, userSettings, pubkey],
    ([$userMutes, $userFollows, $userSettings, $pubkey]) => {
      const words = $userSettings.muted_words
      const minWot = $userSettings.min_wot_score
      const regex =
        words.length > 0
          ? new RegExp(`\\b(${words.map(w => w.toLowerCase().trim()).join("|")})\\b`)
          : null

      return (e: Partial<TrustedEvent>, strict = false) => {
        if (!$pubkey || !e.pubkey) return false

        const {roots, replies} = getAncestorTagValues(e.tags || [])

        if ([e.id, e.pubkey, ...roots, ...replies].some(x => $userMutes.has(x))) return true

        if (regex) {
          if (e.content?.toLowerCase().match(regex)) return true
          if (displayProfileByPubkey(e.pubkey).toLowerCase().match(regex)) return true
        }

        if (strict || $userFollows.has(e.pubkey)) return false

        const wotScore = getUserWotScore(e.pubkey)

        return wotScore < minWot
      }
    },
  ),
)

// Read receipts

export const seenStatusEvents = deriveEvents(repository, {
  filters: [{kinds: [SEEN_GENERAL, SEEN_CONTEXT, SEEN_CONVERSATION]}],
})

export const userSeenStatusEvents = derived(
  [pubkey, seenStatusEvents],
  ([$pubkey, $seenStatusEvents]) => $seenStatusEvents.filter(e => e.pubkey === $pubkey),
)

export const userSeenStatuses = derived(
  [pubkey, plaintext, userSeenStatusEvents],
  ([$pubkey, $plaintext, $userSeenStatusEvents]) => {
    const data = {}

    for (const event of sortEventsAsc($userSeenStatusEvents)) {
      const tags = tryCatch(() => JSON.parse($plaintext[event.id]))

      if (!Array.isArray(tags)) {
        continue
      }

      for (const tag of tags) {
        if (tag[0] === "seen") {
          data[tag[1]] = {
            ts: parseInt(tag[2]),
            ids: new Set(tag.slice(3)),
          }
        }
      }
    }

    return data
  },
)

export const getSeenAt = derived(
  [userSeenStatuses],
  ([$userSeenStatuses]) =>
    (key: string, event: TrustedEvent) => {
      const match = $userSeenStatuses[key]
      const fallback = $userSeenStatuses["*"]
      const ts = Math.max(match?.ts || 0, fallback?.ts || 0)

      if (ts >= event.created_at) return ts
      if (match?.ids.has(event.id)) return event.created_at

      return 0
    },
)

export const isSeen = derived(
  getSeenAt,
  $getSeenAt => (key: string, event: TrustedEvent) => $getSeenAt(key, event) > 0,
)

// Notifications

// -- Main Notifications

export const mainNotifications = derived(
  [pubkey, isEventMuted, deriveEvents(repository, {throttle: 800, filters: [{kinds: noteKinds}]})],
  ([$pubkey, $isEventMuted, $events]) =>
    $events.filter(
      e =>
        e.pubkey !== $pubkey &&
        e.tags.some(t => t[0] === "p" && t[1] === $pubkey) &&
        !$isEventMuted(e),
    ),
)

export const unreadMainNotifications = derived([isSeen, mainNotifications], ([$isSeen, events]) =>
  events.filter(e => !$isSeen("replies", e) && !$isSeen("mentions", e)),
)

export const hasNewNotifications = derived(
  [sessionWithMeta, unreadMainNotifications],
  ([$sessionWithMeta, $unread]) => {
    if ($unread.length > 0) {
      return true
    }

    if ($sessionWithMeta?.onboarding_tasks_completed) {
      return (
        without($sessionWithMeta.onboarding_tasks_completed, Object.values(OnboardingTask)).length >
        0
      )
    }

    return false
  },
)

// -- Reaction Notifications

export const reactionNotifications = derived(
  [
    pubkey,
    isEventMuted,
    deriveEvents(repository, {throttle: 800, filters: [{kinds: reactionKinds}]}),
  ],
  ([$pubkey, $isEventMuted, $events]) =>
    $events.filter(
      e =>
        e.pubkey !== $pubkey &&
        e.tags.some(t => t[0] === "p" && t[1] === $pubkey) &&
        !$isEventMuted(e) &&
        isLike(e),
    ),
)

export const unreadReactionNotifications = derived(
  [isSeen, reactionNotifications],
  ([$isSeen, events]) => events.filter(e => !$isSeen("reactions", e) && !$isSeen("zaps", e)),
)

// Channels

export const getChannelId = (pubkeys: string[]) => sort(uniq(pubkeys)).join(",")

export const getChannelIdFromEvent = (event: TrustedEvent) =>
  getChannelId([event.pubkey, ...getPubkeyTagValues(event.tags)])

export const getChannelSeenKey = (id: string) =>
  crypto.createHash("sha256").update(id.replace(",", "")).digest("hex")

export const messages = deriveEvents(repository, {filters: [{kinds: [4, DIRECT_MESSAGE]}]})

export const channels = derived(
  [pubkey, messages, getSeenAt],
  ([$pubkey, $messages, $getSeenAt]) => {
    const channelsById: Record<string, Channel> = {}

    for (const e of $messages) {
      const id = getChannelIdFromEvent(e)

      if (!id.includes($pubkey)) {
        continue
      }

      const key = getChannelSeenKey(id)
      const chan = channelsById[id] || {
        id,
        last_sent: 0,
        last_received: 0,
        last_checked: 0,
        messages: [],
      }

      chan.messages.push(e)
      chan.last_checked = Math.max(chan.last_checked, $getSeenAt(key, e))

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

export const forcePlatformRelays = (relays: string[]) => forceRelays(relays, env.PLATFORM_RELAYS)

export const withPlatformRelays = (relays: string[]) => withRelays(relays, env.PLATFORM_RELAYS)

export const withIndexers = (relays: string[]) => withRelays(relays, env.INDEXER_RELAYS)

// Lists

export const lists = deriveEventsMapped<PublishedUserList>(repository, {
  filters: [{kinds: EDITABLE_LIST_KINDS}],
  eventToItem: (event: TrustedEvent) => (event.tags.length > 1 ? readUserList(event) : null),
  itemToEvent: prop("event"),
})

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

export const feeds = deriveEventsMapped<PublishedFeed>(repository, {
  filters: [{kinds: [FEED]}],
  itemToEvent: prop("event"),
  eventToItem: readFeed,
})

export const userFeeds = derived([feeds, pubkey], ([$feeds, $pubkey]: [PublishedFeed[], string]) =>
  $feeds.filter(feed => feed.event.pubkey === $pubkey),
)

export const feedFavoriteEvents = deriveEvents(repository, {filters: [{kinds: [FEEDS]}]})

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

      return doPipe(fuse.search(term), [
        results =>
          sortBy((r: any) => r.score - Math.pow(Math.max(0, r.item.score), 1 / 100), results),
        results => results.map((r: any) => r.item.feed),
      ])
    }
  }

  getValue = (option: PublishedFeed) => getAddress(option.event)

  displayValue = (address: string) => displayFeed(this.getOption(address))
}

export const feedSearch = derived(feeds, $feeds => new FeedSearch($feeds))

export const listFeeds = deriveEventsMapped<PublishedListFeed>(repository, {
  filters: [{kinds: [NAMED_BOOKMARKS]}],
  eventToItem: (event: TrustedEvent) =>
    event.tags.length > 1 ? mapListToFeed(readUserList(event)) : undefined,
  itemToEvent: prop("event"),
})

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
  deriveEvents(repository, {filters: [{kinds: [HANDLER_INFORMATION]}]}),
  $events => $events.flatMap(readHandlers),
)

export const handlersByKind = derived(handlers, $handlers =>
  groupBy(handler => handler.kind, $handlers),
)

export const recommendations = deriveEvents(repository, {
  filters: [{kinds: [HANDLER_RECOMMENDATION]}],
})

export const recommendationsByHandlerAddress = derived(recommendations, $events =>
  groupBy(getHandlerAddress, $events),
)

export const deriveHandlersForKind = simpleCache(([kind]: [number]) =>
  derived([handlers, recommendationsByHandlerAddress], ([$handlers, $recs]) =>
    sortBy(
      h => -h.recommendations.length,
      $handlers
        .filter(h => h.kind === kind)
        .map(h => ({...h, recommendations: $recs.get(getAddress(h.event)) || []})),
    ),
  ),
)

// Collections

export const collections = derived(
  deriveEvents(repository, {filters: [{kinds: [LABEL], "#L": ["#t"]}]}),
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

export const getExecutor = (urls: string[]) => {
  const [localUrls, remoteUrls] = partition(equals(LOCAL_RELAY_URL), urls)

  let target: Target = new Relays(remoteUrls.map(url => ctx.net.pool.get(url)))

  if (localUrls.length > 0) {
    target = new Multi([target, new Local(relay)])
  }

  return new Executor(target)
}

export type MySubscribeRequest = PartialSubscribeRequest & {
  skipCache?: boolean
  forcePlatform?: boolean
}

export const subscribe = ({forcePlatform, skipCache, ...request}: MySubscribeRequest) => {
  if (env.PLATFORM_RELAYS.length > 0 && forcePlatform !== false) {
    request.relays = env.PLATFORM_RELAYS
  }

  // Only add our local relay if we have relay selections to avoid bypassing auto relay selection
  if (!skipCache && request.relays?.length > 0) {
    request.relays = [...request.relays, LOCAL_RELAY_URL]
  }

  return baseSubscribe(request)
}

export const subscribePersistent = (request: MySubscribeRequest) => {
  let done = false

  const start = async () => {
    // If the subscription gets closed quickly due to eose, don't start flapping
    await Promise.all([
      sleep(30_000),
      new Promise(resolve => subscribe(request).emitter.on("close", resolve)),
    ])

    if (!done) {
      start()
    }
  }

  start()

  return () => {
    done = true
  }
}

export const load = (request: MySubscribeRequest) =>
  new Promise<TrustedEvent[]>(resolve => {
    const events: TrustedEvent[] = []
    const sub = subscribe({...request, closeOnEose: true})

    sub.emitter.on(SubscriptionEvent.Event, (url: string, e: TrustedEvent) => events.push(e))
    sub.emitter.on(SubscriptionEvent.Complete, (url: string) => resolve(events))
  })

export type MyPublishRequest = PublishRequest & {
  forcePlatform?: boolean
  delay?: number
}

export const publish = ({forcePlatform = true, ...request}: MyPublishRequest) => {
  request.relays = forcePlatform
    ? forcePlatformRelays(request.relays)
    : withPlatformRelays(request.relays)

  // Make sure it gets published to our repository as well. We do it via our local
  // relay rather than directly so that listening subscriptions get notified.
  request.relays = uniq(request.relays.concat(LOCAL_RELAY_URL))

  logger.info(`Publishing event`, request)

  const thunk = publishThunk(request)

  return thunk
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

export type CreateAndPublishOpts = {
  kind: number
  relays: string[]
  tags?: string[][]
  content?: string
  created_at?: number
  anonymous?: boolean
  sk?: string
  timeout?: number
  verb?: "EVENT" | "AUTH"
  forcePlatform?: boolean
}

export const createAndPublish = async ({
  kind,
  relays,
  tags = [],
  content = "",
  created_at = now(),
  anonymous,
  sk,
  timeout,
  verb,
  forcePlatform = true,
}: CreateAndPublishOpts) => {
  const template = createEvent(kind, {content, tags, created_at})
  const event = await sign(template, {anonymous, sk})

  return publish({event, relays, verb, timeout, forcePlatform})
}

export const tagsFromContent = (content: string) => {
  const tags = []

  for (const parsed of Content.parse({content, tags: []})) {
    if (Content.isTopic(parsed)) {
      tags.push(["t", parsed.value])
    }

    if (Content.isEvent(parsed)) {
      tags.push(["q", parsed.value.id, parsed.value.relays?.[0] || ""])
    }

    if (Content.isProfile(parsed)) {
      tags.push(tagPubkey(parsed.value.pubkey))
    }
  }

  return tags
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

// Thread

const getAncestorIds = e => {
  const {roots, replies} = Tags.fromEvent(e).ancestors()

  return [...roots.values().valueOf(), ...replies.values().valueOf()]
}

export class ThreadLoader {
  stopped = false
  parent = withGetter(writable<TrustedEvent>(null))
  ancestors = withGetter(writable<TrustedEvent[]>([]))
  root = withGetter(writable<TrustedEvent>(null))

  constructor(
    readonly note: TrustedEvent,
    readonly relays: string[],
  ) {
    this.loadNotes(getAncestorIds(note))
  }

  stop() {
    this.stopped = true
  }

  loadNotes(ids) {
    if (this.stopped) {
      return
    }

    const seen = new Set(this.getThread().flatMap(getIdAndAddress))
    const filteredIds = ids.filter(id => id && !seen.has(id))

    if (filteredIds.length > 0) {
      load({
        filters: getIdFilters(filteredIds),
        relays: ctx.app.router.FromRelays(this.relays).getUrls(),
        onEvent: batch(300, (events: TrustedEvent[]) => {
          this.addToThread(events)
          this.loadNotes(events.flatMap(getAncestorIds))
        }),
      })
    }
  }

  // Thread building

  getThread() {
    const {root, ancestors, parent} = this

    return [root.get(), ...ancestors.get(), parent.get()].filter(identity)
  }

  addToThread(events) {
    const ancestors = []
    const {roots, replies} = Tags.fromEvent(this.note).ancestors()

    for (const event of events) {
      const ids = getIdOrAddress(event)

      if (replies.find(t => ids.includes(t.value()))) {
        this.parent.set(event)
      } else if (roots.find(t => ids.includes(t.value()))) {
        this.root.set(event)
      } else {
        ancestors.push(event)
      }
    }

    if (ancestors.length > 0) {
      this.ancestors.update($xs =>
        sortBy(prop("created_at"), uniqBy(prop("id"), ancestors.concat($xs))),
      )
    }
  }
}

// Storage

// Remove the old database. TODO remove this
import {deleteDB} from "idb"
import {subscriptionNotices} from "src/domain/connection"
deleteDB("nostr-engine/Storage")

let ready: Promise<any> = Promise.resolve()

const migrateFreshness = (data: {key: string; value: number}[]) => {
  const cutoff = now() - seconds(1, "hour")

  return data.filter(({value}) => value < cutoff)
}

const getScoreEvent = () => {
  const ALWAYS_KEEP = Infinity
  const NEVER_KEEP = 0

  const $sessionKeys = new Set(Object.keys(sessions.get()))
  const $userFollows = get(userFollows)
  const $maxWot = get(maxWot)

  return e => {
    const isFollowing = $userFollows.has(e.pubkey)

    // No need to keep a record of everyone who follows the current user
    if (e.kind === FOLLOWS && !isFollowing) return NEVER_KEEP

    // Always keep stuff by or tagging a signed in user
    if ($sessionKeys.has(e.pubkey)) return ALWAYS_KEEP
    if (e.tags.some(t => $sessionKeys.has(t[1]))) return ALWAYS_KEEP

    // Get rid of irrelevant messages, reactions, and likes
    if (e.wrap || e.kind === 4 || e.kind === WRAP) return NEVER_KEEP
    if (repostKinds.includes(e.kind)) return NEVER_KEEP
    if (reactionKinds.includes(e.kind)) return NEVER_KEEP

    // If the user follows this person, use max wot score
    let score = isFollowing ? $maxWot : getUserWotScore(e.pubkey)

    // Demote non-metadata type events, and introduce recency bias
    if (noteKinds.includes(e.kind)) {
      score = (e.created_at / now()) * score
    }

    // Inflate the score for profiles/relays/follows to avoid redundant fetches
    if (metaKinds.includes(e.kind)) {
      score *= 2
    }

    return score
  }
}

let lastMigrate = 0

const migrateEvents = (events: TrustedEvent[]) => {
  if (events.length < 50_000 || ago(lastMigrate) < 60) {
    return events
  }

  // filter out all event posted to encrypted group
  events = events.filter(e => !e.wrap?.tags.some(t => t[1].startsWith("35834:")))

  // Keep track of the last time we migrated the events, since it's expensive
  lastMigrate = now()

  const scoreEvent = getScoreEvent()

  return take(
    30_000,
    sortBy(e => -scoreEvent(e), events),
  )
}

// Avoid initializing multiple times on hot reload
if (!db) {
  const initialRelays = [
    ...env.DEFAULT_RELAYS,
    ...env.DVM_RELAYS,
    ...env.INDEXER_RELAYS,
    ...env.PLATFORM_RELAYS,
    ...env.SEARCH_RELAYS,
  ]

  setContext({
    net: getDefaultNetContext({getExecutor}),
    app: getDefaultAppContext({
      dufflepudUrl: env.DUFFLEPUD_URL,
      indexerRelays: env.INDEXER_RELAYS,
      requestTimeout: 10000,
      router: makeRouter({
        getLimit: () => getSetting("relay_limit"),
      }),
    }),
  })

  userSettings.subscribe($settings => {
    const autoAuthenticate = $settings.auto_authenticate || env.PLATFORM_RELAYS.length > 0

    ctx.net.authMode = autoAuthenticate ? AuthMode.Implicit : AuthMode.Explicit
    ctx.app.dufflepudUrl = getSetting("dufflepud_url")
  })

  ctx.net.pool.on("init", (connection: Connection) => {
    connection.on(ConnectionEvent.Receive, function (cxn, [verb, ...args]) {
      if (verb == "EVENT" || verb == "EOSE" || verb == "NEG-MSG") return
      subscriptionNotices.update($notices => {
        pushToMapKey($notices, connection.url, {
          created_at: now(),
          url: cxn.url,
          notice: [verb, ...args],
        })
        return $notices
      })
    })
  })

  ready = initStorage("coracle", 2, {
    relays: {keyPath: "url", store: throttled(1000, relays)},
    handles: {keyPath: "nip05", store: throttled(1000, handles)},
    zappers: {keyPath: "lnurl", store: throttled(1000, zappers)},
    freshness: storageAdapters.fromObjectStore(freshness, {
      throttle: 1000,
      migrate: migrateFreshness,
    }),
    plaintext: storageAdapters.fromObjectStore(plaintext, {throttle: 1000}),
    repository: storageAdapters.fromRepository(repository, {throttle: 300, migrate: migrateEvents}),
  }).then(() => Promise.all(initialRelays.map(loadRelay)))
}

export {ready}
