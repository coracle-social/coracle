import Fuse from "fuse.js"
import crypto from "crypto"
import {openDB, deleteDB} from "idb"
import type {IDBPDatabase} from "idb"
import {throttle} from "throttle-debounce"
import {get, derived, writable} from "svelte/store"
import {defer, doPipe, batch, randomInt, seconds, sleep, switcher} from "hurdak"
import {
  pluck,
  find,
  defaultTo,
  equals,
  assoc,
  sortBy,
  max,
  omit,
  partition,
  prop,
  whereEq,
  without,
  fromPairs,
} from "ramda"
import {
  Collection as CollectionStore,
  Worker,
  Writable,
  simpleCache,
  clamp,
  identity,
  last,
  nth,
  splitAt,
  uniq,
  uniqBy,
  now,
  intersection,
  sort,
  groupBy,
  indexBy,
  pushToMapKey,
} from "@welshman/lib"
import {
  WRAP,
  FEEDS,
  COMMUNITY,
  GROUP,
  INBOX_RELAYS,
  WRAP_NIP04,
  COMMUNITIES,
  SEEN_CONVERSATION,
  SEEN_GENERAL,
  SEEN_CONTEXT,
  DIRECT_MESSAGE,
  NAMED_BOOKMARKS,
  HANDLER_RECOMMENDATION,
  HANDLER_INFORMATION,
  RELAYS,
  FOLLOWS,
  MUTES,
  LABEL,
  PROFILE,
  FEED,
  Address,
  Router,
  Tags,
  createEvent,
  getFilterId,
  isContextAddress,
  unionFilters,
  getAddress,
  getIdAndAddress,
  getIdOrAddress,
  getIdFilters,
  hasValidSignature,
  LOCAL_RELAY_URL,
  getFilterResultCardinality,
  isShareableRelayUrl,
  isReplaceable,
  isGroupAddress,
  isCommunityAddress,
  isHashedEvent,
} from "@welshman/util"
import type {Filter, RouterScenario, TrustedEvent, SignedEvent, EventTemplate} from "@welshman/util"
import {
  ConnectionStatus,
  Executor,
  Multi,
  NetworkContext,
  Plex,
  Local,
  Relays,
  Tracker,
  publish as basePublish,
  subscribe as baseSubscribe,
} from "@welshman/net"
import type {PublishRequest, SubscribeRequest} from "@welshman/net"
import * as Content from "@welshman/content"
import {fuzzy, synced, withGetter, pushToKey, tryJson, fromCsv, SearchHelper} from "src/util/misc"
import {
  generatePrivateKey,
  isLike,
  isGiftWrap,
  giftWrapKinds,
  repostKinds,
  noteKinds,
  reactionKinds,
  getRelayTags,
  getRelayTagValues,
} from "src/util/nostr"
import logger from "src/util/logger"
import type {
  GroupMeta,
  PublishedFeed,
  PublishedProfile,
  PublishedListFeed,
  PublishedSingleton,
  PublishedList,
  PublishedGroupMeta,
  RelayPolicy,
  Handle,
} from "src/domain"
import {
  RelayMode,
  displayFeed,
  EDITABLE_LIST_KINDS,
  getSingletonValues,
  makeSingleton,
  ListSearch,
  profileHasName,
  readFeed,
  readList,
  readProfile,
  readCollections,
  CollectionSearch,
  readHandlers,
  mapListToFeed,
  getHandlerAddress,
  displayProfile,
  displayPubkey,
  readSingleton,
  asDecryptedEvent,
  normalizeRelayUrl,
  makeRelayPolicy,
  filterRelaysByNip,
  displayRelayUrl,
  readGroupMeta,
  displayGroupMeta,
} from "src/domain"
import type {
  Channel,
  Group,
  GroupAlert,
  GroupKey,
  GroupRequest,
  GroupStatus,
  PublishInfo,
  Session,
  Topic,
  Zapper,
  AnonymousUserState,
  RelayInfo,
} from "src/engine/model"
import {GroupAccess, OnboardingTask} from "src/engine/model"
import {getNip04, getNip44, getNip59, getSigner, getConnect, sortEventsAsc} from "src/engine/utils"
import {repository, events, deriveEvents, deriveEventsMapped, relay} from "src/engine/repository"

// Base state

export const env = new Writable({
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
  FORCE_GROUP: import.meta.env.VITE_FORCE_GROUP as string,
  IMGPROXY_URL: import.meta.env.VITE_IMGPROXY_URL as string,
  MULTIPLEXTR_URL: import.meta.env.VITE_MULTIPLEXTR_URL as string,
  NIP96_URLS: fromCsv(import.meta.env.VITE_NIP96_URLS) as string[],
  ONBOARDING_LISTS: fromCsv(import.meta.env.VITE_ONBOARDING_LISTS) as string[],
  PLATFORM_PUBKEY: import.meta.env.VITE_PLATFORM_PUBKEY as string,
  PLATFORM_RELAYS: fromCsv(import.meta.env.VITE_PLATFORM_RELAYS).map(normalizeRelayUrl) as string[],
  PLATFORM_ZAP_SPLIT: parseFloat(import.meta.env.VITE_PLATFORM_ZAP_SPLIT) as number,
  SEARCH_RELAYS: fromCsv(import.meta.env.VITE_SEARCH_RELAYS).map(normalizeRelayUrl) as string[],
})

export const pubkey = withGetter(synced<string | null>("pubkey", null))
export const sessions = withGetter(synced<Record<string, Session>>("sessions", {}))
export const handles = withGetter(writable<Record<string, Handle>>({}))
export const zappers = withGetter(writable<Record<string, Zapper>>({}))
export const plaintext = withGetter(writable<Record<string, string>>({}))
export const anonymous = withGetter(writable<AnonymousUserState>({follows: [], relays: []}))
export const groupHints = withGetter(writable<Record<string, string[]>>({}))

export const groups = new CollectionStore<Group>("address")
export const relays = new CollectionStore<RelayInfo>("url")
export const groupAdminKeys = new CollectionStore<GroupKey>("pubkey")
export const groupSharedKeys = new CollectionStore<GroupKey>("pubkey")
export const groupRequests = new CollectionStore<GroupRequest>("id")
export const groupAlerts = new CollectionStore<GroupAlert>("id")
export const publishes = new CollectionStore<PublishInfo>("id", 1000)
export const topics = new CollectionStore<Topic>("name")

export const projections = new Worker<TrustedEvent>({
  getKey: prop("kind"),
})

// Freshness

export const freshness = new Map<string, number>()

export const getFreshnessKey = (key: string, value: any) => `${key}:${value}`

export const getFreshness = (key: string, value: any) =>
  freshness.get(getFreshnessKey(key, value)) || 0

export const setFreshness = (key: string, value: any, ts: number) =>
  freshness.set(getFreshnessKey(key, value), ts)

// Session, signing, encryption

export const getSession = pubkey => sessions.get()[pubkey]

export const session = withGetter(derived([pubkey, sessions], ([$pk, $sessions]) => $sessions[$pk]))

export const connect = withGetter(derived(session, getConnect))
export const signer = withGetter(derived(session, getSigner))
export const nip04 = withGetter(derived(session, getNip04))
export const nip44 = withGetter(derived(session, getNip44))
export const nip59 = withGetter(derived(session, getNip59))
export const canSign = withGetter(derived(signer, $signer => $signer.isEnabled()))

// Settings

export const defaultSettings = {
  relay_limit: 10,
  relay_redundancy: 3,
  default_zap: 21,
  show_media: true,
  muted_words: [],
  hide_sensitive: true,
  report_analytics: true,
  min_wot_score: 0,
  enable_reactions: true,
  enable_client_tag: false,
  auto_authenticate: true,
  nip96_urls: env.get().NIP96_URLS.slice(0, 1),
  imgproxy_url: env.get().IMGPROXY_URL,
  dufflepud_url: env.get().DUFFLEPUD_URL,
  multiplextr_url: env.get().MULTIPLEXTR_URL,
  platform_zap_split: env.get().PLATFORM_ZAP_SPLIT,
}

export const settings = withGetter(
  derived(session, $session => ({...defaultSettings, ...$session?.settings})),
)

export const getSetting = k => prop(k, settings.get())

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

// Plaintext

export const getPlaintext = (e: TrustedEvent) => plaintext.get()[e.id]

export const setPlaintext = (e: TrustedEvent, content) => plaintext.update(assoc(e.id, content))

export const ensurePlaintext = async (e: TrustedEvent) => {
  if (!getPlaintext(e)) {
    const session = getSession(e.pubkey)

    if (getSigner(session).isEnabled()) {
      setPlaintext(e, await getNip59(session).decrypt(e))
    }
  }

  return getPlaintext(e)
}

export const ensureMessagePlaintext = async (e: TrustedEvent) => {
  if (!getPlaintext(e)) {
    const recipient = Tags.fromEvent(e).get("p")?.value()
    const session = getSession(e.pubkey) || getSession(recipient)
    const other = e.pubkey === session?.pubkey ? recipient : e.pubkey
    const nip04 = getNip04(session)

    if (nip04.isEnabled()) {
      plaintext.update(assoc(e.id, await nip04.decryptAsUser(e.content, other)))
    }
  }

  return getPlaintext(e)
}

export const canUnwrap = (event: TrustedEvent) =>
  isGiftWrap(event) &&
  (getSession(Tags.fromEvent(event).get("p")?.value()) || getRecipientKey(event))

export const ensureUnwrapped = async (event: TrustedEvent) => {
  if (!isGiftWrap(event)) {
    return event
  }

  const rumor = repository.eventsByWrap.get(event.id)

  if (rumor) {
    return rumor
  }

  // Decrypt by session
  const session = getSession(Tags.fromEvent(event).get("p")?.value())

  if (session) {
    const canDecrypt =
      (event.kind === WRAP && getNip44(session).isEnabled()) ||
      (event.kind === WRAP_NIP04 && getNip04(session).isEnabled())

    if (canDecrypt) {
      const rumor = await getNip59(session).unwrap(event, session.privkey)

      if (rumor && isHashedEvent(rumor)) {
        tracker.copy(event.id, rumor.id)
        relay.send("EVENT", rumor)

        return rumor
      }
    }
  }

  // Decrypt by group key
  const sk = getRecipientKey(event)

  if (sk) {
    const rumor = await nip59.get().unwrap(event, sk)

    if (rumor && isHashedEvent(rumor)) {
      tracker.copy(event.id, rumor.id)
      relay.send("EVENT", rumor)

      return rumor
    }
  }
}

// Profiles

export const profiles = deriveEventsMapped<PublishedProfile>({
  filters: [{kinds: [PROFILE]}],
  eventToItem: readProfile,
  itemToEvent: prop("event"),
})

export const profilesByPubkey = withGetter(
  derived(profiles, $profiles => indexBy(p => p.event.pubkey, $profiles)),
)

export const getProfile = (pk: string) => profilesByPubkey.get().get(pk)

export const deriveProfile = pk => derived(profilesByPubkey, $m => $m.get(pk))

export const displayProfileByPubkey = (pk: string) => {
  const profile = getProfile(pk)

  return profile ? displayProfile(profile) : displayPubkey(pk)
}

export const deriveProfileDisplay = (pk: string) =>
  derived(deriveProfile(pk), () => displayProfileByPubkey(pk))

export const userDisplay = derived([pubkey, profilesByPubkey], ([$pk, $p]) =>
  $pk ? displayProfileByPubkey($pk) : "",
)

export class ProfileSearch extends SearchHelper<PublishedProfile, string> {
  getSearch = () => {
    const $pubkey = pubkey.get()

    primeWotCaches($pubkey)

    const options = this.options.map(profile => ({
      profile,
      score: getWotScore($pubkey, profile.event.pubkey),
    }))

    const fuse = new Fuse(options, {
      keys: [
        "profile.name",
        "profile.display_name",
        {name: "profile.nip05", weight: 0.5},
        {name: "profile.about", weight: 0.1},
      ],
      threshold: 0.3,
      shouldSort: false,
      includeScore: true,
    })

    return (term: string) => {
      if (!term) {
        return sortBy(item => -item.score, options).map(item => item.profile)
      }

      return doPipe(fuse.search(term), [
        results =>
          sortBy((r: any) => r.score - Math.pow(Math.max(0, r.item.score), 1 / 100), results),
        results => results.map((r: any) => r.item.profile),
      ])
    }
  }

  getValue = (option: PublishedProfile) => option.event.pubkey

  displayValue = (pk: string) => displayProfileByPubkey(pk)
}

export const profileSearch = derived(
  [profiles, handles],
  ([$profiles, $handles]) =>
    new ProfileSearch(
      $profiles
        .filter(profileHasName)
        .map($p => ({...$p, nip05: $handles[$p.event.pubkey]?.nip05})),
    ),
)

// Handles/Zappers

export const getHandle = (pubkey: string) => handles.get()[pubkey]

export const deriveHandle = (pubkey: string) => derived(handles, $handles => $handles[pubkey])

export const getZapper = (pubkey: string) => zappers.get()[pubkey]

export const deriveZapper = (pubkey: string) => derived(zappers, $zappers => $zappers[pubkey])

// Follows

export const followLists = withGetter(
  deriveEventsMapped<PublishedSingleton>({
    filters: [{kinds: [FOLLOWS]}],
    itemToEvent: prop("event"),
    eventToItem: event =>
      readSingleton(
        asDecryptedEvent(event, {
          content: getPlaintext(event),
        }),
      ),
  }),
)

export const followListsByPubkey = withGetter(
  derived(
    followLists,
    $ls => indexBy($l => $l.event.pubkey, $ls) as Map<string, PublishedSingleton>,
  ),
)

export const getFollowList = (pk: string) =>
  followListsByPubkey.get().get(pk) as PublishedSingleton | undefined

export const deriveFollowList = (pk: string) =>
  derived(followListsByPubkey, m => m.get(pk) as PublishedSingleton | undefined)

export const getFollows = (pk: string) => getSingletonValues("p", getFollowList(pk))

export const deriveFollows = (pk: string) =>
  derived(followListsByPubkey, m => getSingletonValues("p", m.get(pk)))

export const isFollowing = (pk: string, tpk: string) => getFollows(pk).has(tpk)

// Mutes

export const muteLists = withGetter(
  deriveEventsMapped<PublishedSingleton>({
    filters: [{kinds: [MUTES]}],
    itemToEvent: prop("event"),
    eventToItem: event =>
      readSingleton(
        asDecryptedEvent(event, {
          content: getPlaintext(event),
        }),
      ),
  }),
)

export const muteListsByPubkey = withGetter(
  derived(muteLists, $ls => indexBy($l => $l.event.pubkey, $ls)),
)

export const getMuteList = (pk: string) =>
  muteListsByPubkey.get().get(pk) as PublishedSingleton | undefined

export const deriveMuteList = (pk: string) =>
  derived(muteListsByPubkey, m => m.get(pk) as PublishedSingleton | undefined)

export const getMutes = (pk: string) => getSingletonValues("p", getMuteList(pk))

export const deriveMutes = (pk: string) =>
  derived(muteListsByPubkey, m => getSingletonValues("p", m.get(pk)))

export const isMuting = (pk, tpk) => getMutes(pk).has(tpk)

// Network, followers, wot

export const getNetwork = simpleCache(([pk]) => {
  const pubkeys = getFollows(pk)
  const network = new Set<string>()

  for (const follow of pubkeys) {
    for (const pubkey of getFollows(follow)) {
      if (!pubkeys.has(pubkey)) {
        network.add(pubkey)
      }
    }
  }

  return network
})

export const getFollowers = simpleCache(
  ([pk]) =>
    new Set(
      followLists
        .get()
        .filter(l => l.valuesByKey.p?.has(pk))
        .map(l => l.event.pubkey),
    ),
)

export const getFollowsWhoFollow = simpleCache(
  ([pk, tpk]) => new Set(Array.from(getFollows(pk)).filter(other => isFollowing(other, tpk))),
)

export const getFollowsWhoMute = simpleCache(
  ([pk, tpk]) => new Set(Array.from(getFollows(pk)).filter(other => isMuting(other, tpk))),
)

export const primeWotCaches = throttle(3000, pk => {
  const mutes: Record<string, string[]> = {}
  const follows: Record<string, string[]> = {}

  // Get follows and mutes from the current user's follows list
  for (const followPk of getFollows(pk)) {
    for (const mutedPk of getMutes(followPk)) {
      pushToKey(mutes, mutedPk, followPk)
    }

    for (const followedPk of getFollows(followPk)) {
      pushToKey(follows, followedPk, followPk)
    }
  }

  // Populate mutes cache
  for (const [k, pubkeys] of Object.entries(mutes)) {
    getFollowsWhoMute.cache.set(getFollowsWhoMute.getKey([pk, k]), new Set(pubkeys))
  }

  // Populate follows cache
  for (const [k, pubkeys] of Object.entries(follows)) {
    getFollowsWhoFollow.cache.set(getFollowsWhoFollow.getKey([pk, k]), new Set(pubkeys))
  }
})

export const maxWot = withGetter(writable(10))

export const getMinWot = () => getSetting("min_wot_score") / maxWot.get()

export const getWotScore = (pk, tpk) => {
  if (!pk) return getFollowers(tpk).size

  const follows = getFollowsWhoFollow(pk, tpk)
  const mutes = getFollowsWhoMute(pk, tpk)
  const score = follows.size - Math.floor(Math.pow(2, Math.log(mutes.size)))

  maxWot.update(maxScore => Math.max(maxScore, score))

  return score
}

// User follows/mutes/network

export const userFollowList = derived(
  [followListsByPubkey, pubkey, anonymous],
  ([$m, $pk, $anon]) => {
    return $pk ? $m.get($pk) : makeSingleton({kind: FOLLOWS, publicTags: $anon.follows})
  },
)

export const userFollows = derived(userFollowList, l => getSingletonValues("p", l))

export const userNetwork = derived(userFollowList, l => getNetwork(l.event.pubkey))

export const userMuteList = derived([muteListsByPubkey, pubkey], ([$m, $pk]) => $m.get($pk))

export const userMutes = derived(userMuteList, l => getSingletonValues("p", l))

// Communities

export const communityLists = withGetter(
  deriveEventsMapped<PublishedSingleton>({
    filters: [{kinds: [COMMUNITIES]}],
    itemToEvent: prop("event"),
    eventToItem: event =>
      readSingleton(
        asDecryptedEvent(event, {
          content: getPlaintext(event),
        }),
      ),
  }),
)

export const communityListsByPubkey = withGetter(
  derived(communityLists, $ls => indexBy($l => $l.event.pubkey, $ls)),
)

export const communityListsByAddress = derived(communityLists, $communityLists => {
  const m = new Map<string, PublishedSingleton[]>()

  for (const list of $communityLists) {
    for (const a of getSingletonValues("a", list)) {
      pushToMapKey(m, a, list)
    }
  }

  return m
})

export const getCommunityList = (pk: string) =>
  communityListsByPubkey.get().get(pk) as PublishedSingleton | undefined

export const deriveCommunityList = (pk: string) =>
  derived(communityListsByPubkey, m => m.get(pk) as PublishedSingleton | undefined)

export const getCommunities = (pk: string) => getSingletonValues("a", getCommunityList(pk))

export const deriveCommunities = (pk: string) =>
  derived(communityListsByPubkey, m => getSingletonValues("a", m.get(pk)))

// Groups

export const groupMeta = deriveEventsMapped<PublishedGroupMeta>({
  filters: [{kinds: [GROUP, COMMUNITY]}],
  itemToEvent: prop("event"),
  eventToItem: readGroupMeta,
})

export const groupMetaByAddress = withGetter(
  derived(groupMeta, $metas => indexBy($meta => getAddress($meta.event), $metas)),
)

export const deriveGroupMeta = (address: string) =>
  derived(groupMetaByAddress, $m => $m.get(address))

export const displayGroupByAddress = a => displayGroupMeta(groupMetaByAddress.get().get(a))

export class GroupSearch extends SearchHelper<GroupMeta & {score: number}, string> {
  config = {
    keys: [{name: "identifier", weight: 0.2}, "name", {name: "about", weight: 0.5}],
    threshold: 0.3,
    shouldSort: false,
    includeScore: true,
  }

  getSearch = () => {
    const fuse = new Fuse(this.options, this.config)
    const sortFn = (r: any) => r.score - Math.pow(Math.max(0, r.item.score), 1 / 100)

    return (term: string) =>
      term
        ? sortBy(sortFn, fuse.search(term)).map((r: any) => r.item)
        : sortBy(meta => -meta.score, this.options)
  }

  getValue = (option: GroupMeta) => getAddress(option.event)

  displayValue = displayGroupByAddress
}

export const groupMetaSearch = derived(
  [groupMeta, communityListsByAddress, userFollows],
  ([$groupMeta, $communityListsByAddress, $userFollows]) => {
    const options = $groupMeta.map(meta => {
      const lists = $communityListsByAddress.get(getAddress(meta.event)) || []
      const members = lists.map(l => l.event.pubkey)
      const followedMembers = intersection(members, Array.from($userFollows))

      return {...meta, score: followedMembers.length}
    })

    return new GroupSearch(options)
  },
)

// Legacy
export const deriveGroup = address => {
  const {pubkey, identifier: id} = Address.from(address)

  return groups.key(address).derived(defaultTo({id, pubkey, address}))
}

export const getRecipientKey = wrap => {
  const pubkey = Tags.fromEvent(wrap).values("p").first()
  const sharedKey = groupSharedKeys.key(pubkey).get()

  if (sharedKey) {
    return sharedKey.privkey
  }

  const adminKey = groupAdminKeys.key(pubkey).get()

  if (adminKey) {
    return adminKey.privkey
  }

  return null
}

export const getGroupReqInfo = (address = null) => {
  let since = session.get()?.groups_last_synced || 0
  let $groupSharedKeys = groupSharedKeys.get()
  let $groupAdminKeys = groupAdminKeys.get()

  if (address) {
    since = session.get()?.groups?.[address]?.last_synced || 0
    $groupSharedKeys = $groupSharedKeys.filter(whereEq({group: address}))
    $groupAdminKeys = $groupAdminKeys.filter(whereEq({group: address}))
  }

  // Account for timestamp randomization
  since = Math.max(0, since - seconds(7, "day"))

  const admins = []
  const addresses = []
  const recipients = [pubkey.get()].filter(identity)

  for (const key of [...$groupSharedKeys, ...$groupAdminKeys]) {
    const {pubkey} = Address.from(key.group)

    admins.push(pubkey)
    addresses.push(key.group)
    recipients.push(key.pubkey)
  }

  const relays = hints.WithinMultipleContexts(addresses).getUrls()

  return {admins, recipients, relays, since}
}

export const getCommunityReqInfo = (address = null) => {
  const {groups, groups_last_synced} = session.get() || {}
  const since = groups?.[address]?.last_synced || groups_last_synced || 0

  return {
    since: since - seconds(6, "hour"),
    relays: hints.WithinContext(address).getUrls(),
  }
}

export const deriveSharedKeyForGroup = (address: string) =>
  groupSharedKeys.derived($keys =>
    last(sortBy(prop("created_at"), $keys.filter(whereEq({group: address})))),
  )

export const deriveAdminKeyForGroup = (address: string) => groupAdminKeys.key(address.split(":")[1])

export const getGroupStatus = (session, address) =>
  (session?.groups?.[address] || {}) as GroupStatus

export const deriveGroupStatus = address =>
  derived(session, $session => getGroupStatus($session, address))

export const userIsGroupMember = withGetter(
  derived(session, $session => (address, includeRequests = false) => {
    const status = getGroupStatus($session, address)

    if (isCommunityAddress(address)) {
      return status.joined
    }

    if (isGroupAddress(address)) {
      if (includeRequests && status.access === GroupAccess.Requested) {
        return true
      }

      return status.access === GroupAccess.Granted
    }

    return false
  }),
)

export const deriveGroupOptions = (defaultGroups = []) =>
  derived([session, userIsGroupMember], ([$session, $userIsGroupMember]) => {
    const options = []

    for (const address of Object.keys($session?.groups || {})) {
      const group = groups.key(address).get()

      if (group && $userIsGroupMember(address)) {
        options.push(group)
      }
    }

    for (const address of defaultGroups) {
      options.push({address})
    }

    return uniqBy(prop("address"), options)
  })

export const getUserCircles = (session: Session) => {
  const $userIsGroupMember = userIsGroupMember.get()

  return Object.entries(session?.groups || {})
    .filter(([a, s]) => !repository.deletes.has(a) && $userIsGroupMember(a))
    .map(([a, s]) => a)
}

export const getUserGroups = (session: Session) => getUserCircles(session).filter(isGroupAddress)

export const getUserCommunities = (session: Session) =>
  getUserCircles(session).filter(isCommunityAddress)

// Events

export const isEventMuted = withGetter(
  derived(
    [userMutes, userFollows, settings, pubkey, userIsGroupMember],
    ([$userMutes, $userFollows, $settings, $pubkey, $userIsGroupMember]) => {
      const words = $settings.muted_words
      const minWot = $settings.min_wot_score
      const regex =
        words.length > 0 ? new RegExp(`\\b(${words.map(w => w.toLowerCase()).join("|")})\\b`) : null

      return (e: Partial<TrustedEvent>, strict = false) => {
        if (!$pubkey || e.pubkey === $pubkey) {
          return false
        }

        const tags = Tags.wrap(e.tags || [])
        const {roots, replies} = tags.ancestors()

        if (
          find(
            t => $userMutes.has(t),
            [e.id, e.pubkey, ...roots.values().valueOf(), ...replies.values().valueOf()],
          )
        ) {
          return true
        }

        if (regex && e.content?.toLowerCase().match(regex)) {
          return true
        }

        if (!strict) {
          return false
        }
        const isInGroup = tags.groups().values().some($userIsGroupMember)
        const isInCommunity = tags
          .communities()
          .values()
          .some(a => false)
        const wotAdjustment = isInCommunity || isInGroup ? 1 : 0

        if (
          !$userFollows.has(e.pubkey) &&
          getWotScore($pubkey, e.pubkey) < minWot - wotAdjustment
        ) {
          return true
        }

        return false
      }
    },
  ),
)

// Read receipts

export const seenStatusEvents = deriveEvents({
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
      const tags = $plaintext[event.id]

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

export const isSeen = derived(
  [userSeenStatuses],
  ([$userSeenStatuses]) =>
    (key: string, event: TrustedEvent) =>
      $userSeenStatuses[key]?.ts >= event.created_at || $userSeenStatuses[key]?.ids.has(event.id),
)

// Notifications

export const notifications = derived(
  [pubkey, events, isEventMuted],
  ([$pubkey, $events, $isEventMuted]) => {
    const kinds = [...noteKinds, ...reactionKinds]

    return Array.from(repository.query([{"#p": [$pubkey]}])).filter(
      e =>
        kinds.includes(e.kind) &&
        e.pubkey !== $pubkey &&
        !$isEventMuted(e) &&
        (e.kind !== 7 || isLike(e)),
    )
  },
)

export const mainNotifications = derived(notifications, events =>
  events.filter(e => noteKinds.includes(e.kind)),
)

export const reactionNotifications = derived(notifications, events =>
  events.filter(e => reactionKinds.concat(9734).includes(e.kind)),
)

export const unreadMainNotifications = derived([isSeen, mainNotifications], ([$isSeen, events]) =>
  events.filter(e => !$isSeen("replies", e) && !$isSeen("mentions", e)),
)

export const unreadReactionNotifications = derived(
  [isSeen, reactionNotifications],
  ([$isSeen, events]) => events.filter(e => !$isSeen("reactions", e) && !$isSeen("zaps", e)),
)

export const hasNewNotifications = derived(
  [session, unreadMainNotifications],
  ([$session, $unread]) => {
    if ($unread.length > 0) {
      return true
    }

    if ($session?.onboarding_tasks_completed) {
      return without($session.onboarding_tasks_completed, Object.values(OnboardingTask)).length > 0
    }

    return false
  },
)

export const createNotificationGroups = ($notifications, kinds) => {
  // Convert zaps to zap requests
  const convertZap = e => {
    if (e.kind === 9735) {
      return tryJson(() => JSON.parse(Tags.fromEvent(e).get("description")?.value()))
    }

    return e
  }

  const $pubkey = pubkey.get()
  const groups = {}

  // Group notifications by event
  for (const ix of $notifications) {
    if (!kinds.includes(ix.kind)) {
      continue
    }

    const parentId = Tags.fromEvent(ix).whereKey("e").parent()?.value()
    const event = parentId ? repository.getEvent(parentId) : null

    if (reactionKinds.includes(ix.kind) && event?.pubkey !== $pubkey) {
      continue
    }

    // Group and sort by day/event so we can group clustered reactions to the same event
    const delta = now() - ix.created_at
    const deltaDisplay = Math.round(delta / seconds(3, "hour")).toString()
    const key = deltaDisplay + (parentId || `self:${ix.id}`)

    groups[key] = groups[key] || {key, event, interactions: []}
    groups[key].interactions.push(convertZap(ix))
  }

  return sortBy(
    g => -g.timestamp,
    Object.values(groups).map((group: any) => {
      const {event, interactions} = group
      const timestamp = interactions
        .map(e => e.created_at)
        .concat(event?.created_at || 0)
        .reduce(max, 0)

      return {...group, timestamp}
    }),
  )
}

// Channels

export const getChannelId = (pubkeys: string[]) => sort(uniq(pubkeys)).join(",")

export const getChannelIdFromEvent = (event: TrustedEvent) =>
  getChannelId([event.pubkey, ...Tags.fromEvent(event).values("p").valueOf()])

export const getChannelSeenKey = (id: string) =>
  crypto.createHash("sha256").update(id.replace(",", "")).digest("hex")

export const messages = deriveEvents({filters: [{kinds: [4, DIRECT_MESSAGE]}]})

export const channels = derived(
  [pubkey, messages, userSeenStatuses],
  ([$pubkey, $messages, $userSeenStatuses]) => {
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

      const status = $userSeenStatuses[key]

      if (status?.ids.has(e.id)) {
        chan.last_checked = Math.max(chan.last_checked, e.created_at)
      } else {
        chan.last_checked = Math.max(chan.last_checked, status?.ts || 0)
      }

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

// Relays

export const getRelay = url => defaultTo({url}, relays.key(url).get())

export const deriveRelay = url => derived(relays.key(url), defaultTo({url}))

export const getNip50Relays = () =>
  uniq([...env.get().SEARCH_RELAYS, ...filterRelaysByNip(50, relays.get()).map(r => r.url)])

export class RelaySearch extends SearchHelper<RelayInfo, string> {
  config = {keys: ["url", "name", "description"]}

  getSearch = () => {
    const search = fuzzy(this.options, this.config)

    return term => (term ? search(term) : sortBy(r => -r.count || 0, this.options))
  }

  getValue = (option: RelayInfo) => option.url

  displayValue = displayRelayUrl
}

export const relaySearch = derived(relays, $relays => new RelaySearch($relays))

// Relay policies

export const relayLists = withGetter(
  deriveEventsMapped<PublishedSingleton>({
    filters: [{kinds: [RELAYS]}],
    itemToEvent: prop("event"),
    eventToItem: event =>
      readSingleton(
        asDecryptedEvent(event, {
          content: getPlaintext(event),
        }),
      ),
  }),
)

export const inboxRelayLists = withGetter(
  deriveEventsMapped<PublishedSingleton>({
    filters: [{kinds: [INBOX_RELAYS]}],
    itemToEvent: prop("event"),
    eventToItem: event =>
      readSingleton(
        asDecryptedEvent(event, {
          content: getPlaintext(event),
        }),
      ),
  }),
)

export const deriveInboxRelays = (pubkeys: string[]) =>
  deriveEvents({filters: [{kinds: [INBOX_RELAYS], authors: pubkeys}]})

export const derivePubkeysWithoutInbox = (pubkeys: string[]) =>
  derived(deriveInboxRelays(pubkeys), $events =>
    pubkeys.filter(pk => !$events.some(e => e.pubkey === pk && e.tags.length > 0)),
  )

export const legacyRelayLists = withGetter(
  deriveEventsMapped<{event: TrustedEvent; policy: RelayPolicy[]}>({
    filters: [{kinds: [FOLLOWS]}],
    itemToEvent: prop("event"),
    eventToItem: event => {
      try {
        const policy = Object.entries(
          JSON.parse(event.content) as Record<string, {write: boolean; read: boolean}>,
        )
          .filter(([url]) => isShareableRelayUrl(url))
          .map(([url, {write = true, read = true}]) => makeRelayPolicy({url, read, write}))

        return {event, policy}
      } catch (e) {
        // pass
      }
    },
  }),
)

export const relayPoliciesByPubkey = withGetter(
  derived(
    [relayLists, inboxRelayLists, legacyRelayLists],
    ([$relayLists, $inboxRelayLists, $legacyRelayLists]) => {
      const policiesByUrlByPubkey = new Map<string, Map<string, RelayPolicy>>()

      for (const {event, publicTags} of $relayLists) {
        const policiesByUrl = new Map()

        for (const [_, url, mode] of getRelayTags(publicTags)) {
          const read = !mode || mode === RelayMode.Read
          const write = !mode || mode === RelayMode.Write
          const policy = makeRelayPolicy({url, read, write})

          policiesByUrl.set(policy.url, policy)
        }

        policiesByUrlByPubkey.set(event.pubkey, policiesByUrl)
      }

      for (const {event, publicTags} of $inboxRelayLists) {
        const policiesByUrl = policiesByUrlByPubkey.get(event.pubkey) || new Map()

        for (const url of getRelayTagValues(publicTags)) {
          const normalizedUrl = normalizeRelayUrl(url)
          const defaultPolicy = makeRelayPolicy({url})
          const policy = policiesByUrl.get(defaultPolicy.url)

          policiesByUrl.set(normalizedUrl, {...defaultPolicy, ...policy, inbox: true})
        }

        policiesByUrlByPubkey.set(event.pubkey, policiesByUrl)
      }

      for (const {event, policy} of $legacyRelayLists) {
        if (!policiesByUrlByPubkey.has(event.pubkey)) {
          policiesByUrlByPubkey.set(event.pubkey, indexBy(prop("url"), policy))
        }
      }

      const result = new Map<string, RelayPolicy[]>()

      for (const [pubkey, policiesByUrl] of policiesByUrlByPubkey.entries()) {
        result.set(pubkey, Array.from(policiesByUrl.values()))
      }

      return result
    },
  ),
)

export const getPubkeyRelayPolicies = (pubkey: string, mode: string = null) => {
  const policies = relayPoliciesByPubkey.get().get(pubkey) || []

  return mode ? policies.filter(prop(mode)) : policies
}

export const userRelayPolicies = derived(
  [relayPoliciesByPubkey, pubkey, anonymous],
  ([$m, $pk, $anon]) =>
    $m.get($pk) ||
    getRelayTags($anon.relays).map(([_, url, mode]) => {
      const read = !mode || mode === RelayMode.Read
      const write = !mode || mode === RelayMode.Write

      return makeRelayPolicy({url, read, write})
    }),
)

export const deriveUserRelayPolicy = url =>
  derived(
    userRelayPolicies,
    $policies => $policies.find(p => p.url === url) || makeRelayPolicy({url}),
  )

// Relay selection

export const getGroupRelayUrls = address => {
  const meta = groupMetaByAddress.get().get(address)

  if (meta?.relays) {
    return meta.relays.map(nth(1))
  }

  const latestKey = last(
    sortBy(prop("created_at"), get(groupSharedKeys).filter(whereEq({group: address}))),
  )

  if (latestKey?.hints) {
    return latestKey.hints
  }

  return get(groupHints)[address] || []
}

export const forceRelays = (relays: string[], forceRelays: string[]) =>
  forceRelays.length > 0 ? forceRelays : relays

export const withRelays = (relays: string[], otherRelays: string[]) =>
  uniq([...relays, ...otherRelays])

export const forcePlatformRelays = (relays: string[]) =>
  forceRelays(relays, Array.from(env.get().PLATFORM_RELAYS))

export const withPlatformRelays = (relays: string[]) =>
  withRelays(relays, env.get().PLATFORM_RELAYS)

export const withIndexers = (relays: string[]) => withRelays(relays, env.get().INDEXER_RELAYS)

export const hints = new Router({
  getUserPubkey: () => pubkey.get(),
  getGroupRelays: getGroupRelayUrls,
  getCommunityRelays: getGroupRelayUrls,
  getPubkeyRelays: (pubkey: string, mode: string) =>
    getPubkeyRelayPolicies(pubkey, mode).map(r => r.url),
  getFallbackRelays: () => [...env.get().PLATFORM_RELAYS, ...env.get().DEFAULT_RELAYS],
  getSearchRelays: () => env.get().SEARCH_RELAYS,
  getLimit: () => parseInt(getSetting("relay_limit")),
  getRedundancy: () => parseInt(getSetting("relay_redundancy")),
  getRelayQuality: (url: string) => {
    const oneMinute = 60 * 1000
    const oneHour = 60 * oneMinute
    const oneDay = 24 * oneHour
    const oneWeek = 7 * oneDay
    const {count = 0, faults = []} = relays.key(url).get() || {}
    const connection = NetworkContext.pool.get(url, {autoConnect: false})

    // If we haven't connected, consult our relay record and see if there has
    // been a recent fault. If there has been, penalize the relay. If there have been several,
    // don't use the relay.
    if (!connection) {
      const lastFault = last(faults) || 0

      if (faults.filter(n => n > Date.now() - oneHour).length > 10) {
        return 0
      }

      if (faults.filter(n => n > Date.now() - oneDay).length > 50) {
        return 0
      }

      if (faults.filter(n => n > Date.now() - oneWeek).length > 100) {
        return 0
      }

      return Math.max(0, Math.min(0.5, (Date.now() - oneMinute - lastFault) / oneHour))
    }

    return switcher(connection.meta.getStatus(), {
      [ConnectionStatus.Unauthorized]: 0.5,
      [ConnectionStatus.Forbidden]: 0,
      [ConnectionStatus.Error]: 0,
      [ConnectionStatus.Closed]: 0.6,
      [ConnectionStatus.Slow]: 0.5,
      [ConnectionStatus.Ok]: 1,
      default: clamp([0.5, 1], count / 1000),
    })
  },
})

// Topics

export const getTopicSearch = $topics => fuzzy($topics, {keys: ["name"], threshold: 0.3})

export const searchTopics = topics.derived(getTopicSearch)

export const searchTopicNames = searchTopics.derived(search => term => pluck("name", search(term)))

// Lists

export const lists = deriveEventsMapped<PublishedList>({
  filters: [{kinds: EDITABLE_LIST_KINDS}],
  eventToItem: (event: TrustedEvent) => (event.tags.length > 1 ? readList(event) : null),
  itemToEvent: prop("event"),
})

export const userLists = derived([lists, pubkey], ([$lists, $pubkey]: [PublishedList[], string]) =>
  sortBy(
    l => l.title.toLowerCase(),
    $lists.filter(list => list.event.pubkey === $pubkey),
  ),
)

export const listSearch = derived(lists, $lists => new ListSearch($lists))

// Feeds

export const feeds = deriveEventsMapped<PublishedFeed>({
  filters: [{kinds: [FEED]}],
  itemToEvent: prop("event"),
  eventToItem: readFeed,
})

export const userFeeds = derived([feeds, pubkey], ([$feeds, $pubkey]: [PublishedFeed[], string]) =>
  $feeds.filter(feed => feed.event.pubkey === $pubkey),
)

export const feedFavorites = deriveEventsMapped<PublishedSingleton>({
  filters: [{kinds: [FEEDS]}],
  itemToEvent: prop("event"),
  eventToItem: event =>
    readSingleton(
      asDecryptedEvent(event, {
        content: getPlaintext(event),
      }),
    ),
})

export const feedFavoritesByAddress = withGetter(
  derived(feedFavorites, $feedFavorites => {
    const $feedFavoritesByAddress = new Map<string, PublishedSingleton[]>()

    for (const singleton of $feedFavorites) {
      for (const address of getSingletonValues("a", singleton)) {
        pushToMapKey($feedFavoritesByAddress, address, singleton)
      }
    }

    return $feedFavoritesByAddress
  }),
)

export const userFeedFavorites = derived(
  [feedFavorites, pubkey],
  ([$singletons, $pubkey]: [PublishedSingleton[], string]) =>
    $singletons.find(singleton => singleton.event.pubkey === $pubkey),
)

export const userFavoritedFeeds = derived(userFeedFavorites, $singleton =>
  Array.from(getSingletonValues("a", $singleton))
    .map(repository.getEvent)
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

export const listFeeds = deriveEventsMapped<PublishedListFeed>({
  filters: [{kinds: [NAMED_BOOKMARKS]}],
  eventToItem: (event: TrustedEvent) =>
    event.tags.length > 1 ? mapListToFeed(readList(event)) : undefined,
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
  deriveEvents({filters: [{kinds: [HANDLER_INFORMATION]}]}),
  $events => $events.flatMap(readHandlers),
)

export const handlersByKind = derived(handlers, $handlers =>
  groupBy(handler => handler.kind, $handlers),
)

export const recommendations = deriveEvents({filters: [{kinds: [HANDLER_RECOMMENDATION]}]})

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
  deriveEvents({filters: [{kinds: [LABEL], "#L": ["#t"]}]}),
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

export const addRepostFilters = (filters: Filter[]) =>
  filters.flatMap(original => {
    const filterChunk = [original]

    if (!original.kinds) {
      filterChunk.push({...original, kinds: [6, 16]})
    } else {
      if (original.kinds.includes(1)) {
        filterChunk.push({...original, kinds: [6]})
      }

      const otherKinds = without([1], original.kinds)

      if (otherKinds.length > 0) {
        filterChunk.push({...original, kinds: [16], "#k": otherKinds.map(String)})
      }
    }

    return filterChunk
  })

export type RelayFilters = {
  relay: string
  filters: Filter[]
}

export const getFilterSelections = (filters: Filter[]): RelayFilters[] => {
  const scenarios: RouterScenario[] = []
  const filtersById = new Map<string, Filter>()

  for (const filter of filters) {
    if (filter.search) {
      const id = getFilterId(filter)

      filtersById.set(id, filter)
      scenarios.push(hints.product([id], hints.options.getSearchRelays()))
    } else {
      const contexts = filter["#a"]?.filter(isContextAddress)

      if (contexts?.length > 0) {
        for (const {relay, values} of hints
          .WithinMultipleContexts(contexts)
          .policy(hints.addMinimalFallbacks)
          .getSelections()) {
          const contextFilter = {...filter, "#a": Array.from(values)}
          const id = getFilterId(contextFilter)

          filtersById.set(id, contextFilter)
          scenarios.push(hints.product([id], [relay]))
        }
      } else if (filter.authors) {
        for (const {relay, values} of hints
          .FromPubkeys(filter.authors)
          .policy(hints.addMinimalFallbacks)
          .getSelections()) {
          const authorsFilter = {...filter, authors: Array.from(values)}
          const id = getFilterId(authorsFilter)

          filtersById.set(id, authorsFilter)
          scenarios.push(hints.product([id], [relay]))
        }
      } else {
        const id = getFilterId(filter)

        filtersById.set(id, filter)
        scenarios.push(
          hints.product([id], hints.ReadRelays().policy(hints.addMinimalFallbacks).getUrls()),
        )
      }
    }
  }

  const selections = sortBy(
    ({filters}) => -filters[0].authors?.length,
    hints
      .merge(scenarios)
      // Use low redundancy because filters will be very low cardinality
      .redundancy(1)
      .getSelections()
      .map(({values, relay}) => ({
        filters: values.map((id: string) => filtersById.get(id)),
        relay,
      })),
  )

  // Pubkey-based selections can get really big. Use the most popular relays for the long tail
  const [keep, discard] = splitAt(getSetting("relay_limit"), selections)

  for (const target of keep.slice(0, getSetting("relay_redundancy"))) {
    target.filters = unionFilters(discard.concat(target).flatMap(prop("filters")))
  }

  return keep
}

export const getExecutor = (urls: string[]) => {
  const muxUrl = getSetting("multiplextr_url")
  const [localUrls, remoteUrls] = partition(equals(LOCAL_RELAY_URL), urls)

  // Try to use our multiplexer, but if it fails to connect fall back to relays. If
  // we're only connecting to a single relay, just do it directly, unless we already
  // have a connection to the multiplexer open, in which case we're probably doing
  // AUTH with a single relay.
  let target

  if (muxUrl && remoteUrls.length > 0) {
    const connection = NetworkContext.pool.get(muxUrl)

    if (connection.socket.isOpen()) {
      target = new Plex(remoteUrls, connection)
    }
  }

  if (!target) {
    target = new Relays(remoteUrls.map(url => NetworkContext.pool.get(url)))
  }

  if (localUrls.length > 0) {
    target = new Multi([target, new Local(relay)])
  }

  return new Executor(target)
}

const seenChallenges = new Set()

export const onAuth = async (url, challenge) => {
  const {FORCE_GROUP, PLATFORM_RELAYS} = env.get()

  if (!canSign.get()) {
    return
  }

  if (seenChallenges.has(challenge)) {
    return
  }

  if (!FORCE_GROUP && PLATFORM_RELAYS.length === 0 && !getSetting("auto_authenticate")) {
    return
  }

  seenChallenges.add(challenge)

  const event = await signer.get().signAsUser(
    createEvent(22242, {
      tags: [
        ["relay", url],
        ["challenge", challenge],
      ],
    }),
  )

  NetworkContext.pool.get(url).send(["AUTH", event])

  return event
}

export type MySubscribeRequest = SubscribeRequest & {
  onEvent?: (event: TrustedEvent) => void
  onEose?: (url: string) => void
  onComplete?: () => void
  skipCache?: boolean
  forcePlatform?: boolean
}

export const subscribe = ({forcePlatform = true, ...request}: MySubscribeRequest) => {
  const events = []

  // If we already have all results for any filter, don't send the filter to the network
  for (const filter of request.filters.splice(0)) {
    const cardinality = getFilterResultCardinality(filter)

    if (cardinality !== null) {
      const results = repository.query([filter])

      if (results.length === cardinality) {
        for (const event of results) {
          events.push(event)
        }

        break
      }
    }

    request.filters.push(filter)
  }

  request.relays = forcePlatform
    ? forcePlatformRelays(request.relays)
    : withPlatformRelays(request.relays)

  if (!request.skipCache) {
    request.relays = uniq(request.relays.concat(LOCAL_RELAY_URL))
  }

  const sub = baseSubscribe(request)

  sub.emitter.on("event", async (url: string, event: TrustedEvent) => {
    repository.publish(event)
    request.onEvent?.(event)

    projections.push(await ensureUnwrapped(event))
  })

  if (request.onEose) {
    sub.emitter.on("eose", request.onEose)
  }

  if (request.onComplete) {
    sub.emitter.on("complete", request.onComplete)
  }

  // Keep cached results async so the caller can set up handlers
  setTimeout(() => {
    for (const event of events) {
      sub.emitter.emit("event", LOCAL_RELAY_URL, event)
    }
  })

  return sub
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

export const LOAD_OPTS = {timeout: 5000, closeOnEose: true}

export const load = (request: MySubscribeRequest) =>
  new Promise(resolve => {
    const events = []
    const sub = subscribe({...request, ...LOAD_OPTS})

    sub.emitter.on("event", (url: string, event: TrustedEvent) => events.push(event))
    sub.emitter.on("complete", (url: string) => resolve(events))
  })

export const loadOne = (request: MySubscribeRequest) =>
  new Promise<TrustedEvent | null>(resolve => {
    const sub = subscribe({...request, ...LOAD_OPTS})

    sub.emitter.on("event", (url: string, event: TrustedEvent) => {
      resolve(event)
      sub.close()
    })

    sub.emitter.on("complete", () => {
      resolve(null)
    })
  })

export type MyPublishRequest = PublishRequest & {
  forcePlatform?: boolean
}

export const publish = ({forcePlatform = true, ...request}: MyPublishRequest) => {
  request.relays = forcePlatform
    ? forcePlatformRelays(request.relays)
    : withPlatformRelays(request.relays)

  // Make sure it gets published to our repository as well. We do it via our local
  // relay rather than directly so that listening subscriptions get notified.
  request.relays = uniq(request.relays.concat(LOCAL_RELAY_URL))

  logger.info(`Publishing event`, request)

  const pub = basePublish(request)

  // Add the event to projections
  if (canUnwrap(request.event)) {
    ensureUnwrapped(request.event).then(projections.push)
  } else {
    projections.push(request.event)
  }

  // Listen to updates and update our publish queue
  if (canUnwrap(request.event) || request.event.pubkey === pubkey.get()) {
    const pubInfo = omit(["emitter", "result"], pub)

    pub.emitter.on("*", t => publishes.key(pubInfo.id).set(pubInfo))
  }

  return pub
}

export const sign = (template, opts: {anonymous?: boolean; sk?: string} = {}) => {
  if (opts.anonymous) {
    return signer.get().signWithKey(template, generatePrivateKey())
  }

  if (opts.sk) {
    return signer.get().signWithKey(template, opts.sk)
  }

  return signer.get().signAsUser(template)
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

export const tracker = new Tracker()

Object.assign(NetworkContext, {
  onAuth,
  getExecutor,
  onEvent: (url: string, event: SignedEvent) => tracker.track(event.id, url),
  isDeleted: (url: string, event: SignedEvent) => repository.isDeleted(event),
  hasValidSignature: (url: string, event: SignedEvent) => {
    if (url === LOCAL_RELAY_URL) {
      return true
    }

    return hasValidSignature(event)
  },
})

// Publish

export const uniqTags = tags =>
  uniqBy((t: string[]) => (t[0] === "param" ? t.join(":") : t.slice(0, 2).join(":")), tags)

export const makeZapSplit = (pubkey: string, split = 1) => [
  "zap",
  pubkey,
  hints.FromPubkeys([pubkey]).getUrl(),
  String(split),
]

export const mention = (pubkey: string, ...args: unknown[]) => [
  "p",
  pubkey,
  hints.FromPubkeys([pubkey]).getUrl(),
  displayProfileByPubkey(pubkey),
]

export const mentionGroup = (address: string, ...args: unknown[]) => [
  "a",
  address,
  hints.WithinContext(address).getUrl(),
]

export const mentionEvent = (event: TrustedEvent, mark = "") => {
  const url = hints.Event(event).getUrl()
  const tags = [["e", event.id, url, mark, event.pubkey]]

  if (isReplaceable(event)) {
    tags.push(["a", getAddress(event), url, mark, event.pubkey])
  }

  return tags
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
      tags.push(mention(parsed.value.pubkey))
    }
  }

  return tags
}

export const getReplyTags = (parent: TrustedEvent) => {
  const tags = Tags.fromEvent(parent)
  const replyTagValues = getIdAndAddress(parent)
  const userPubkey = pubkey.get()
  const replyTags = []

  // Mention the parent's author
  if (parent.pubkey !== userPubkey) {
    replyTags.push(mention(parent.pubkey))
  }

  // Inherit p-tag mentions
  for (const pubkey of tags.values("p").valueOf()) {
    if (pubkey !== userPubkey) {
      replyTags.push(mention(pubkey))
    }
  }

  // Based on NIP 10 legacy tags, order is root, mentions, reply
  const {roots, replies, mentions} = tags.ancestors()

  // Root comes first
  if (roots.exists()) {
    for (const t of roots.valueOf()) {
      replyTags.push(t.set(2, hints.EventRoots(parent).getUrl()).set(3, "root").valueOf())
    }
  } else {
    for (const t of replies.valueOf()) {
      replyTags.push(t.set(2, hints.EventParents(parent).getUrl()).set(3, "root").valueOf())
    }
  }

  // Make sure we don't repeat any tag values
  const isRepeated = v => replyTagValues.includes(v) || replyTags.find(t => t[1] === v)

  // Inherit mentions
  for (const t of mentions.valueOf()) {
    if (!isRepeated(t.value())) {
      replyTags.push(t.set(3, "mention").valueOf())
    }
  }

  // Inherit replies if they weren't already included
  if (roots.exists()) {
    for (const t of replies.valueOf()) {
      if (!isRepeated(t.value())) {
        replyTags.push(t.set(3, "mention").valueOf())
      }
    }
  }

  // Add a/e-tags for the parent event
  const mark = replies.exists() ? "reply" : "root"
  for (const t of mentionEvent(parent, mark)) {
    replyTags.push(t.valueOf())
  }

  return replyTags
}

export const getReactionTags = (parent: TrustedEvent) => {
  const replyTags = []

  // Mention the parent's author
  if (parent.pubkey !== pubkey.get()) {
    replyTags.push(mention(parent.pubkey))
  }

  // Add a/e-tags for the parent event
  for (const t of mentionEvent(parent, "root")) {
    replyTags.push(t.valueOf())
  }

  return replyTags
}

export const getClientTags = () => {
  if (!getSetting("enable_client_tag")) {
    return []
  }

  const {CLIENT_NAME = "", CLIENT_ID} = env.get()
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
        relays: hints.fromRelays(this.relays).getUrls(),
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

type IndexedDBAdapterOpts = {
  limit?: number
  set?: (xs: any[]) => void
  subscribe?: (f: (xs: any[]) => void) => () => void
  sort?: (xs: any[]) => any[]
  filter?: (x: any) => boolean
  migrate?: (xs: any[]) => any[]
}

class IndexedDBAdapter {
  constructor(
    readonly name,
    readonly key,
    readonly opts: IndexedDBAdapterOpts,
  ) {}

  async initialize(storage: Storage) {
    const {name, key, opts} = this
    const {set, subscribe, sort, limit = 100, filter = identity, migrate = identity} = opts
    const data = await storage.getAll(name)

    let prev: any[] = migrate(data.filter(filter))

    await set(prev)

    subscribe(
      throttle(randomInt(3000, 5000), async current => {
        if (storage.dead.get()) {
          return
        }

        current = current.filter(prop(key))

        const prevIds = new Set(prev.map(prop(key)))
        const currentIds = new Set(current.map(prop(key)))
        const newRecords = current.filter(r => !prevIds.has(r[key]))
        const removedRecords = prev.filter(r => !currentIds.has(r[key]))

        if (newRecords.length > 0) {
          await storage.bulkPut(name, newRecords)
        }

        if (removedRecords.length > 0) {
          if (name === "repository") {
            console.trace("deleting", removedRecords.length, current.length)
          } else {
            await storage.bulkDelete(name, removedRecords.map(prop(key)))
          }
        }

        // If we have much more than our limit, prune our store. This will get persisted
        // the next time around.
        if (current.length > limit * 1.5) {
          set((sort ? sort(current) : current).slice(0, limit))
        }

        prev = current
      }),
    )
  }
}

const DB_NAME = "nostr-engine/Storage"

class Storage {
  db: IDBPDatabase
  ready = defer()
  dead = withGetter(writable(false))

  constructor(
    readonly version,
    readonly adapters: IndexedDBAdapter[],
  ) {
    this.initialize()
  }

  close = async () => {
    this.dead.set(true)

    await this.db?.close()
  }

  clear = async () => {
    localStorage.clear()

    await this.close()
    await deleteDB(DB_NAME)
  }

  async initialize() {
    const indexedDBAdapters = this.adapters.filter(
      a => a instanceof IndexedDBAdapter,
    ) as IndexedDBAdapter[]

    if (window.indexedDB) {
      window.addEventListener("beforeunload", () => this.close())

      this.db = await openDB(DB_NAME, this.version, {
        upgrade(db, oldVersion, newVersion, transaction, event) {
          const names = indexedDBAdapters.map(adapter => adapter.name)

          for (const name of db.objectStoreNames) {
            if (!names.includes(name)) {
              db.deleteObjectStore(name)
            }
          }

          for (const adapter of indexedDBAdapters) {
            try {
              db.createObjectStore(adapter.name, {
                keyPath: adapter.key,
              })
            } catch (e) {
              logger.warn(e)
            }
          }
        },
      })

      await Promise.all(this.adapters.map(adapter => adapter.initialize(this)))
    }

    this.ready.resolve()
  }

  getAll = async (name: string) => {
    const tx = this.db.transaction(name, "readwrite")
    const store = tx.objectStore(name)
    const result = await store.getAll()

    await tx.done

    return result
  }

  bulkPut = async (name: string, data: any[]) => {
    const tx = this.db.transaction(name, "readwrite")
    const store = tx.objectStore(name)

    await Promise.all(data.map(item => store.put(item)))
    await tx.done
  }

  bulkDelete = async (name: string, ids: string[]) => {
    const tx = this.db.transaction(name, "readwrite")
    const store = tx.objectStore(name)

    await Promise.all(ids.map(id => store.delete(id)))
    await tx.done
  }
}

const scoreEvent = e => {
  if (getSession(e.pubkey)) return -Infinity
  if (giftWrapKinds.includes(e.kind)) return -Infinity
  if (reactionKinds.includes(e.kind)) return 0
  if (repostKinds.includes(e.kind)) return 0
  return -e.created_at
}

const objectAdapter = (name, key, store, opts = {}) =>
  new IndexedDBAdapter(name, key, {
    set: xs => store.set(fromPairs(xs.map(({key, value}) => [key, value]))),
    subscribe: f =>
      store.subscribe(m => f(Object.entries(m).map(([key, value]) => ({key, value})))),
    ...opts,
  })

const collectionAdapter = (name, key, store, opts = {}) =>
  new IndexedDBAdapter(name, key, {
    set: xs => store.set(xs),
    subscribe: f => store.subscribe(f),
    ...opts,
  })

export const storage = new Storage(15, [
  objectAdapter("handles", "key", handles, {limit: 10000}),
  objectAdapter("zappers", "key", zappers, {limit: 10000}),
  objectAdapter("plaintext", "key", plaintext, {limit: 100000}),
  collectionAdapter("publishes", "id", publishes, {sort: sortBy(prop("created_at"))}),
  collectionAdapter("topics", "name", topics, {limit: 1000, sort: sortBy(prop("last_seen"))}),
  collectionAdapter("relays", "url", relays, {limit: 1000, sort: sortBy(prop("count"))}),
  collectionAdapter("groups", "address", groups, {limit: 1000, sort: sortBy(prop("count"))}),
  collectionAdapter("groupAlerts", "id", groupAlerts, {sort: sortBy(prop("created_at"))}),
  collectionAdapter("groupRequests", "id", groupRequests, {sort: sortBy(prop("created_at"))}),
  collectionAdapter("groupSharedKeys", "pubkey", groupSharedKeys, {
    limit: 1000,
    sort: sortBy(prop("created_at")),
  }),
  collectionAdapter("groupAdminKeys", "pubkey", groupAdminKeys, {limit: 1000}),
  collectionAdapter("repository", "id", events, {limit: 100000, sort: sortBy(scoreEvent)}),
])
