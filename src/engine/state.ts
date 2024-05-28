import Fuse from "fuse.js"
import {nip19} from "nostr-tools"
import {throttle} from "throttle-debounce"
import {derived} from "svelte/store"
import {
  Fetch,
  createMapOf,
  defer,
  displayList,
  doPipe,
  batch,
  randomInt,
  seconds,
  sleep,
  switcher,
  switcherFn,
  tryFunc,
} from "hurdak"
import {
  any,
  pluck,
  find,
  defaultTo,
  equals,
  filter,
  join,
  assoc,
  sortBy,
  max,
  none,
  omit,
  partition,
  prop,
  whereEq,
  pick,
  without,
} from "ramda"
import {
  Collection as CollectionStore,
  Worker,
  Writable,
  bech32ToHex,
  cached,
  clamp,
  Derived,
  identity,
  last,
  nth,
  pushToMapKey,
  splitAt,
  uniq,
  uniqBy,
  writable,
  now,
  inc,
  sort,
  groupBy,
  indexBy,
} from "@welshman/lib"
import {
  READ_RECEIPT,
  NAMED_BOOKMARKS,
  HANDLER_RECOMMENDATION,
  HANDLER_INFORMATION,
  LABEL,
  PROFILE,
  FEED,
  Address,
  Router,
  Tags,
  createEvent,
  fromNostrURI,
  getFilterId,
  isContextAddress,
  normalizeRelayUrl as _normalizeRelayUrl,
  unionFilters,
  getIdAndAddress,
  getIdOrAddress,
  getIdFilters,
  hasValidSignature,
  LOCAL_RELAY_URL,
  getFilterResultCardinality,
} from "@welshman/util"
import type {Filter, RouterScenario, TrustedEvent, SignedEvent, Zapper} from "@welshman/util"
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
import type {Publish, PublishRequest, SubscribeRequest} from "@welshman/net"
import {
  fuzzy,
  synced,
  withGetter,
  getter,
  createBatcher,
  pushToKey,
  tryJson,
  fromCsv,
  SearchHelper,
} from "src/util/misc"
import {parseContent} from "src/util/notes"
import {
  appDataKeys,
  generatePrivateKey,
  isLike,
  isGiftWrap,
  personKinds,
  giftWrapKinds,
  repostKinds,
  noteKinds,
  reactionKinds,
} from "src/util/nostr"
import logger from "src/util/logger"
import type {
  PublishedFeed,
  PublishedProfile,
  PublishedListFeed,
  Collection,
  PublishedList,
} from "src/domain"
import {
  EDITABLE_LIST_KINDS,
  ListSearch,
  FeedSearch,
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
} from "src/domain"
import type {
  Channel,
  DisplayEvent,
  Group,
  GroupAlert,
  GroupKey,
  GroupRequest,
  GroupStatus,
  Handle,
  Person,
  PublishInfo,
  Relay,
  RelayPolicy,
  Session,
  Topic,
} from "src/engine/model"
import {GroupAccess, OnboardingTask} from "src/engine/model"
import {getNip04, getNip44, getNip59, getSigner, getConnect, unwrapRepost} from "src/engine/utils"
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

export const relays = new CollectionStore<Relay>("url")
export const groups = new CollectionStore<Group>("address")
export const groupAdminKeys = new CollectionStore<GroupKey>("pubkey")
export const groupSharedKeys = new CollectionStore<GroupKey>("pubkey")
export const groupRequests = new CollectionStore<GroupRequest>("id")
export const groupAlerts = new CollectionStore<GroupAlert>("id")
export const people = new CollectionStore<Person>("pubkey")
export const publishes = new CollectionStore<PublishInfo>("id", 1000)
export const topics = new CollectionStore<Topic>("name")
export const channels = new CollectionStore<Channel>("id")

export const projections = new Worker<TrustedEvent>({
  getKey: prop("kind"),
})

// Session and settings

export const getSession = pubkey => sessions.get()[pubkey]

export const getCurrentSession = () => sessions.get()[pubkey.get()]

export const getDefaultSettings = () => ({
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
})

export const getSettings = () => ({...getDefaultSettings(), ...getSession(pubkey.get())?.settings})

export const getSetting = k => prop(k, getSettings())

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

export const dufflepud = (path: string) => `${getSetting("dufflepud_url")}/${path}`

export const stateKey = new Derived(pubkey, $pk => $pk || "anonymous")

export const session = new Derived(
  [pubkey, sessions],
  ([$pk, $sessions]: [string, Record<string, Session>]) => ($pk ? $sessions[$pk] : null),
)

export const user = new Derived(
  [stateKey, people.mapStore],
  ([$k, $p]: [string, Map<string, Person>]) => $p.get($k) || {pubkey: $k},
)

export const connect = session.derived(getConnect)
export const signer = session.derived(getSigner)
export const nip04 = session.derived(getNip04)
export const nip44 = session.derived(getNip44)
export const nip59 = session.derived(getNip59)
export const canSign = signer.derived($signer => $signer.isEnabled())
export const settings = user.derived(getSettings)

// Profiles

export const profiles = deriveEventsMapped<PublishedProfile>({
  filters: [{kinds: [PROFILE]}],
  eventToItem: readProfile,
  itemToEvent: prop("event"),
})

export const profilesByPubkey = derived(profiles, $profiles =>
  indexBy(p => p.event.pubkey, $profiles),
)

export const getProfilesByPubkey = getter(profilesByPubkey)

export const getProfile = (pk: string) => getProfilesByPubkey().get(pk)

export const deriveProfile = pk => derived(profilesByPubkey, $m => $m.get(pk))

export const displayProfileByPubkey = (pk: string) => displayProfile(getProfile(pk))

export const profilesWithName = derived(profiles, $profiles => $profiles.filter(profileHasName))

export class ProfileSearch extends SearchHelper<PublishedProfile, string> {
  config = {
    keys: ["name", "display_name", {name: "nip05", weight: 0.5}, {name: "about", weight: 0.1}],
    threshold: 0.3,
    shouldSort: false,
    includeScore: true,
  }

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

export const profileSearch = derived(profilesWithName, $profiles => new ProfileSearch($profiles))

// People

export const displayHandle = (handle: Handle) =>
  handle.address.startsWith("_@") ? last(handle.address.split("@")) : handle.address

export const getMutedPubkeys = $person =>
  ($person?.mutes || []).map(nth(1)).filter(pk => pk?.length === 64) as string[]

export const getMutes = $person => new Set(getMutedPubkeys($person))

export const isMuting = ($person, pubkey) => getMutedPubkeys($person).includes(pubkey)

export const getFollowedPubkeys = $person =>
  ($person?.petnames || []).map(nth(1)).filter(pk => pk?.length === 64) as string[]

export const getFollows = $person => new Set(getFollowedPubkeys($person))

export const isFollowing = ($person, pubkey) => getFollowedPubkeys($person).includes(pubkey)

export const getFollowers = cached({
  maxSize: Infinity,
  getKey: join(":"),
  getValue: ([pk]) => people.get().filter($p => isFollowing($p, pk)),
})

export const getNetwork = $person => {
  const pubkeys = getFollows($person)
  const network = new Set<string>()

  for (const follow of pubkeys) {
    for (const pubkey of getFollowedPubkeys(people.key(follow).get())) {
      if (!pubkeys.has(pubkey)) {
        network.add(pubkey)
      }
    }
  }

  return network
}

export const getFollowsWhoFollow = cached({
  maxSize: Infinity,
  getKey: join(":"),
  getValue: ([pk, tpk]) =>
    getFollowedPubkeys(people.key(pk).get()).filter(pk => isFollowing(people.key(pk).get(), tpk)),
})

export const getFollowsWhoMute = cached({
  maxSize: Infinity,
  getKey: join(":"),
  getValue: ([pk, tpk]) =>
    getFollowedPubkeys(people.key(pk).get()).filter(pk => isMuting(people.key(pk).get(), tpk)),
})

export const primeWotCaches = throttle(3000, pk => {
  const mutes: Record<string, string[]> = {}
  const follows: Record<string, string[]> = {}

  // Get follows mutes from the current user's follows list
  for (const followPk of Array.from(getFollows(people.key(pk).get()))) {
    const follow = people.key(followPk).get()

    for (const mutedPk of Array.from(getMutes(follow))) {
      pushToKey(mutes, mutedPk, followPk)
    }

    for (const followedPk of Array.from(getFollows(follow))) {
      pushToKey(follows, followedPk, followPk)
    }
  }

  // Populate mutes cache
  for (const [k, pubkeys] of Object.entries(mutes)) {
    getFollowsWhoMute.cache.set(getFollowsWhoMute.getKey([pk, k]), pubkeys)
  }

  // Populate follows cache
  for (const [k, pubkeys] of Object.entries(follows)) {
    getFollowsWhoFollow.cache.set(getFollowsWhoFollow.getKey([pk, k]), pubkeys)
  }

  // For everyone else in our database, populate an empty list
  for (const person of people.get()) {
    if (!mutes[person.pubkey]) {
      getFollowsWhoMute.cache.set(getFollowsWhoMute.getKey([pk, person.pubkey]), [])
    }

    if (!follows[person.pubkey]) {
      getFollowsWhoFollow.cache.set(getFollowsWhoFollow.getKey([pk, person.pubkey]), [])
    }
  }
})

export const maxWot = writable(10)

export const getMinWot = () => getSetting("min_wot_score") / maxWot.get()

export const getWotScore = (pk, tpk) => {
  if (!people.key(pk).exists()) {
    return getFollowers(tpk).length
  }

  const follows = getFollowsWhoFollow(pk, tpk)
  const mutes = getFollowsWhoMute(pk, tpk)
  const score = follows.length - Math.floor(Math.pow(2, Math.log(mutes.length)))

  maxWot.update(maxScore => Math.max(maxScore, score))

  return score
}

const annotatePerson = pubkey => {
  const relays = hints.FromPubkeys([pubkey]).getUrls()

  return {
    pubkey,
    npub: nip19.npubEncode(pubkey),
    nprofile: nip19.nprofileEncode({pubkey, relays}),
    relays,
  }
}

export const decodePerson = entity => {
  entity = fromNostrURI(entity)

  let type, data
  try {
    ;({type, data} = nip19.decode(entity))
  } catch (e) {
    return annotatePerson(entity)
  }

  return switcherFn(type, {
    nprofile: () => ({
      pubkey: data.pubkey,
      relays: data.relays,
      npub: nip19.npubEncode(data.pubkey),
      nprofile: nip19.nprofileEncode(data),
    }),
    npub: () => annotatePerson(data),
    default: () => annotatePerson(entity),
  })
}

export const derivePerson = pubkey => people.key(pubkey).derived(defaultTo({pubkey}))

export const mutes = user.derived(getMutes)

export const follows = user.derived(getFollows)

export const network = user.derived(getNetwork)

export const deriveMuted = (value: string) => mutes.derived(s => s.has(value))

export const deriveFollowing = (pubkey: string) => follows.derived(s => s.has(pubkey))

// Events

export const isEventMuted = new Derived(
  [mutes, settings, pubkey],
  ([$mutes, $settings, $pubkey]) => {
    const words = $settings.muted_words
    const minWot = $settings.min_wot_score
    const $follows = follows.get()
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
          t => $mutes.has(t),
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

      const isGroupMember = tags
        .groups()
        .values()
        .some(a => deriveIsGroupMember(a).get())
      const isCommunityMember = tags
        .communities()
        .values()
        .some(a => false)
      const wotAdjustment = isCommunityMember || isGroupMember ? 1 : 0

      if (!$follows.has(e.pubkey) && getWotScore($pubkey, e.pubkey) < minWot - wotAdjustment) {
        return true
      }

      return false
    }
  },
)

// Channels

export const sortChannels = $channels =>
  sortBy((c: Channel) => -Math.max(c.last_sent || 0, c.last_received || 0), $channels)

export const channelHasNewMessages = (c: Channel) =>
  c.last_received > Math.max(c.last_sent || 0, c.last_checked || 0)

export const getChannelId = (pubkeys: string[]) => sort(uniq(pubkeys)).join(",")

export const getChannelIdFromEvent = (event: TrustedEvent) =>
  getChannelId([event.pubkey, ...Tags.fromEvent(event).values("p").valueOf()])

export const userChannels = new Derived(
  [channels.throttle(300), mutes, pubkey],
  ([$channels, $mutes, $pk]): Channel[] => {
    if (!$pk) {
      return []
    }

    return $channels.filter($channel => {
      if (!$channel.messages) {
        return false
      }

      return $channel.members?.includes($pk) && none(pk => $mutes.has(pk), $channel.members || [])
    })
  },
)

export const unreadChannels = channels.derived(filter(channelHasNewMessages))

export const hasNewMessages = unreadChannels.derived(any((c: Channel) => Boolean(c.last_sent)))

// Groups

export const deriveGroup = address => {
  const {pubkey, identifier: id} = Address.from(address)

  return groups.key(address).derived(defaultTo({id, pubkey, address}))
}

export const getWotGroupMembers = address =>
  Array.from(follows.get()).filter(pk =>
    people
      .key(pk)
      .get()
      ?.communities?.some(t => t[1] === address),
  )

export const searchGroups = groups.throttle(300).derived($groups => {
  const options = $groups
    .filter(group => !repository.deletes.has(group.address))
    .map(group => ({group, score: getWotGroupMembers(group.address).length}))

  const fuse = new Fuse(options, {
    keys: [{name: "group.id", weight: 0.2}, "group.meta.name", "group.meta.about"],
    threshold: 0.3,
    shouldSort: false,
    includeScore: true,
  })

  return (term: string) => {
    if (!term) {
      return sortBy(item => -item.score, options).map(item => item.group)
    }

    return doPipe(fuse.search(term), [
      $results =>
        sortBy((r: any) => r.score - Math.pow(Math.max(0, r.item.score), 1 / 100), $results),
      $results => $results.map((r: any) => r.item.group),
    ])
  }
})

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

  const relays = forcePlatformRelays(hints.WithinMultipleContexts(addresses).getUrls())

  return {admins, recipients, relays, since}
}

export const getCommunityReqInfo = (address = null) => {
  const {groups, groups_last_synced} = session.get() || {}
  const since = groups?.[address]?.last_synced || groups_last_synced || 0

  return {
    since: since - seconds(6, "hour"),
    relays: forcePlatformRelays(hints.WithinContext(address).getUrls()),
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
  session.derived($session => getGroupStatus($session, address))

export const getIsGroupMember = (session, address, includeRequests = false) => {
  const status = getGroupStatus(session, address)

  if (address.startsWith("34550:")) {
    return status.joined
  }

  if (address.startsWith("35834:")) {
    if (includeRequests && status.access === GroupAccess.Requested) {
      return true
    }

    return status.access === GroupAccess.Granted
  }

  return false
}

export const deriveIsGroupMember = (address, includeRequests = false) =>
  session.derived($session => getIsGroupMember($session, address, includeRequests))

export const deriveGroupOptions = (defaultGroups = []) =>
  session.derived($session => {
    const options = []

    for (const address of Object.keys($session?.groups || {})) {
      const group = groups.key(address).get()

      if (group && deriveIsGroupMember(address).get()) {
        options.push(group)
      }
    }

    for (const address of defaultGroups) {
      options.push({address})
    }

    return uniqBy(prop("address"), options)
  })

export const getUserCircles = (session: Session) =>
  Object.entries(session?.groups || {})
    .filter(([a, s]) => deriveIsGroupMember(a).get())
    .map(([a, s]) => a)

export const deriveUserCircles = () => session.derived(getUserCircles)

export const getUserGroups = (session: Session) =>
  getUserCircles(session).filter(a => a.startsWith("35834:"))

export const deriveUserGroups = () => session.derived(getUserGroups)

export const getUserCommunities = (session: Session) =>
  getUserCircles(session).filter(a => a.startsWith("34550:"))

export const deriveUserCommunities = () => session.derived(getUserCommunities)

// Read receipts

export const optimisticReadReceipts = withGetter(synced("seen", []))

export const publishedReadReceipts = derived(
  deriveEvents({filters: [{kinds: [READ_RECEIPT]}]}),
  events => new Set(events.flatMap(e => e.tags.map(nth(1)))),
)

export const unpublishedReadReceipts = derived(
  [publishedReadReceipts, optimisticReadReceipts],
  ([published, optimistic]: [Set<string>, string[]]) => optimistic.filter(id => !published.has(id)),
)

export const allReadReceipts = derived(
  [publishedReadReceipts, optimisticReadReceipts],
  ([published, optimistic]: [Set<string>, string[]]) => new Set([...published, ...optimistic]),
)

export const isSeen = derived(allReadReceipts, $m => e => $m.has(e.id))

// Notifications

export const notifications = derived(events, $events => {
  const $pubkey = pubkey.get()
  const $isEventMuted = isEventMuted.get()
  const kinds = [...noteKinds, ...reactionKinds]

  return Array.from(repository.query([{"#p": [$pubkey]}])).filter(
    e =>
      kinds.includes(e.kind) &&
      e.pubkey !== $pubkey &&
      !$isEventMuted(e) &&
      (e.kind !== 7 || isLike(e)),
  )
})

export const unreadNotifications = derived([isSeen, notifications], ([$isSeen, $notifications]) => {
  const since = now() - seconds(30, "day")

  return $notifications.filter(
    e => !reactionKinds.includes(e.kind) && e.created_at > since && !$isSeen(e),
  )
})

export const groupNotifications = new Derived(
  [session, events, groupRequests, groupAlerts, groupAdminKeys],
  x => x,
)
  .throttle(3000)
  .derived(([$session, $events, $requests, $alerts, $adminKeys, $addresses]) => {
    const addresses = new Set(getUserCircles($session))
    const adminPubkeys = new Set($adminKeys.map(k => k.pubkey))
    const $isEventMuted = isEventMuted.get()

    const shouldSkip = e => {
      const tags = Tags.fromEvent(e)
      const context = tags.context().values().valueOf()

      return (
        !context.some(a => addresses.has(a)) ||
        context.some(a => repository.deletes.has(a)) ||
        !noteKinds.includes(e.kind) ||
        e.pubkey === $session.pubkey ||
        // Skip mentions since they're covered in normal notifications
        tags.values("p").has($session.pubkey) ||
        $isEventMuted(e)
      )
    }

    return sortBy(
      x => -x.created_at,
      [
        ...$requests
          .filter(r => !r.resolved && !repository.deletes.has(r.group))
          .map(assoc("t", "request")),
        ...$alerts
          .filter(a => !adminPubkeys.has(a.pubkey) && !repository.deletes.has(a.group))
          .map(assoc("t", "alert")),
        ...$events
          .map(e => (repostKinds.includes(e.kind) ? unwrapRepost(e) : e))
          .filter(e => e && !shouldSkip(e)),
      ],
    )
  })

export const unreadGroupNotifications = derived(
  [isSeen, groupNotifications],
  ([$isSeen, $groupNotifications]) => {
    const since = now() - seconds(30, "day")

    return $groupNotifications.filter(e => e.created_at > since && !$isSeen(e))
  },
)

export const hasNewNotifications = derived(
  [session, unreadNotifications],
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

  const groups = {}

  // Group notifications by event
  for (const ix of $notifications) {
    if (!kinds.includes(ix.kind)) {
      continue
    }

    const parentId = Tags.fromEvent(ix).whereKey("e").parent()?.value()
    const event = parentId ? repository.getEvent(parentId) : null

    if (reactionKinds.includes(ix.kind) && !event) {
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

// Relays

export function normalizeRelayUrl(url: string, opts = {}) {
  if (url === LOCAL_RELAY_URL) {
    return url
  }

  try {
    return _normalizeRelayUrl(url, opts)
  } catch (e) {
    return url
  }
}

export const urlToRelay = url => ({url: normalizeRelayUrl(url)}) as Relay

export const urlToRelayPolicy = url =>
  ({...urlToRelay(url), read: true, write: true}) as RelayPolicy

export const decodeRelay = entity => {
  entity = fromNostrURI(entity)

  try {
    return {url: nip19.decode(entity).data}
  } catch (e) {
    return {url: entity}
  }
}

export const displayRelayUrl = (url: string) => last(url.split("://")).replace(/\/$/, "")

export const displayRelay = ({url}: Relay) => displayRelayUrl(url)

export const displayRelays = (relays: Relay[], max = 3) =>
  displayList(relays.map(displayRelay), "and", max)

export const getRelaySearch = ($relays: Relay[]): ((term: string) => Relay[]) => {
  const search = fuzzy($relays, {keys: ["url", "name", "description"]})

  return term => {
    if (!term) {
      return sortBy(r => -r.count || 0, $relays)
    }

    return search(term)
  }
}

export const getSearchableRelays = ($relays: Relay[]) => {
  const urls = pluck(
    "url",
    $relays.filter(r => (r.info?.supported_nips || []).includes(50)),
  )

  return uniq(env.get().SEARCH_RELAYS.concat(urls)).slice(0, 8) as string[]
}

export const getPubkeyRelays = (pubkey: string, mode: string = null) => {
  const relays = people.key(pubkey).get()?.relays || []

  return mode ? relays.filter(prop(mode)) : relays
}

export const getPubkeyRelayUrls = (pubkey: string, mode: string = null) =>
  pluck("url", getPubkeyRelays(pubkey, mode))

export const getUserRelays = (mode: string = null) => getPubkeyRelays(stateKey.get(), mode)

export const getUserRelayUrls = (mode: string = null) => pluck("url", getUserRelays(mode))

export const getGroupRelayUrls = address => {
  const group = groups.key(address).get()
  const keys = groupSharedKeys.get()

  if (group?.relays) {
    return group.relays
  }

  const latestKey = last(sortBy(prop("created_at"), keys.filter(whereEq({group: address}))))

  if (latestKey?.hints) {
    return latestKey.hints
  }

  return []
}

export const forceRelays = (relays: string[], forceRelays: string[]) =>
  forceRelays.length > 0 ? forceRelays : relays

export const forcePlatformRelays = (relays: string[]) =>
  forceRelays(relays, Array.from(env.get().PLATFORM_RELAYS))

export const forceRelaySelections = (selections: RelayFilters[], forceRelays: string[]) => {
  if (forceRelays.length === 0) {
    return selections
  }

  const filtersById = new Map<string, Filter>()
  const newSelections = new Map<string, string[]>()

  for (const {filters} of selections) {
    for (const forceRelay of forceRelays) {
      for (const filter of filters) {
        const id = getFilterId(filter)

        filtersById.set(id, filter)
        pushToMapKey(newSelections, forceRelay, id)
      }
    }
  }

  return hints.relaySelectionsFromMap(newSelections).map(({values, relay}) => ({
    relay,
    filters: unionFilters(values.map(id => filtersById.get(id))),
  }))
}

export const forcePlatformRelaySelections = (selections: RelayFilters[]) =>
  forceRelaySelections(selections, Array.from(env.get().PLATFORM_RELAYS))

export const withFallbacks = (relays: string[]) =>
  relays.length > 0 ? relays : env.get().DEFAULT_RELAYS

export const withIndexers = (relays: string[]) => uniq(relays.concat(env.get().INDEXER_RELAYS))

export const hints = new Router({
  getUserPubkey: () => stateKey.get(),
  getGroupRelays: getGroupRelayUrls,
  getCommunityRelays: getGroupRelayUrls,
  getPubkeyRelays: getPubkeyRelayUrls,
  getFallbackRelays: () => [...env.get().PLATFORM_RELAYS, ...env.get().DEFAULT_RELAYS],
  getIndexerRelays: () => env.get().INDEXER_RELAYS,
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

export const searchRelays = relays.derived(getRelaySearch)

export const searchRelayUrls = searchRelays.derived(search => term => pluck("url", search(term)))

export const searchableRelays = relays.derived(getSearchableRelays)

export const relayPolicies = user.derived($user => $user?.relays || [])

export const relayPolicyUrls = relayPolicies.derived(pluck("url"))

export const deriveRelay = url => relays.key(url).derived(defaultTo({url}))

export const deriveHasRelay = url => relayPolicyUrls.derived(urls => urls.includes(url))

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
  eventToItem: readFeed,
  itemToEvent: prop("event"),
})

export const userFeeds = derived([feeds, pubkey], ([$feeds, $pubkey]: [PublishedFeed[], string]) =>
  sortBy(
    f => f.title.toLowerCase(),
    $feeds.filter(feed => feed.event.pubkey === $pubkey),
  ),
)

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

export const deriveHandlersForKind = cached({
  maxSize: 100,
  getKey: ([kind]: [number]) => kind,
  getValue: ([kind]: [number]) =>
    derived(handlers, $handlers => $handlers.filter(h => h.kind === kind)),
})

// Collections

export const collections = derived(
  deriveEvents({filters: [{kinds: [LABEL], "#L": ["#t"]}]}),
  readCollections,
)

export const userCollections = derived(
  [collections, pubkey],
  ([$collections, $pubkey]: [Collection[], string]) =>
    sortBy(
      f => f.name.toLowerCase(),
      $collections.filter(collection => collection.pubkey === $pubkey),
    ),
)

export const collectionSearch = derived(
  collections,
  $collections => new CollectionSearch($collections),
)

// Zaps

export const fetchZapper = createBatcher(3000, async (lnurls: string[]) => {
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

export const getZapper = cached({
  maxSize: 100,
  getKey: ([lnurl]) => lnurl,
  getValue: ([lnurl]) => fetchZapper(lnurl),
})

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

  if (muxUrl && (remoteUrls.length > 1 || NetworkContext.pool.has(muxUrl))) {
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
  onComplete?: () => void
  skipCache?: boolean
}

export const subscribe = (request: MySubscribeRequest) => {
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

  if (!request.skipCache) {
    request.relays = uniq(request.relays.concat(LOCAL_RELAY_URL))
  }

  const sub = baseSubscribe(request)

  sub.emitter.on("event", (url: string, event: TrustedEvent) => {
    repository.publish(event)
    projections.push(event)
    request.onEvent?.(event)
  })

  if (request.onComplete) {
    sub.emitter.on("complete", request.onComplete)
  }

  // Keep it async so the caller can set up handlers
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

export const LOAD_OPTS = {timeout: 3000, closeOnEose: true}

export const load = (request: MySubscribeRequest) => subscribe({...request, ...LOAD_OPTS}).result

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

export const publish = (request: PublishRequest) => {
  // Make sure it gets published to our repository as well. We do it via our local
  // relay rather than directly so that listening subscriptions get notified.
  request.relays = uniq(request.relays.concat(LOCAL_RELAY_URL))

  logger.info(`Publishing event`, request)

  const pub = basePublish(request)

  // Add the event to projections
  projections.push(request.event)

  // Listen to updates and update our publish queue
  if (isGiftWrap(request.event) || request.event.pubkey === pubkey.get()) {
    const pubInfo = omit(["emitter", "result"], pub)

    pub.emitter.on("*", t => publishes.key(pubInfo.id).set(pubInfo))
  }

  return pub
}

export const sign = (template, opts: {anonymous?: boolean; sk?: string}) => {
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
  anonymous?: boolean
  sk?: string
  timeout?: number
  verb?: "EVENT" | "AUTH"
}

export const createAndPublish = async ({
  kind,
  relays,
  tags = [],
  content = "",
  anonymous,
  sk,
  timeout,
  verb,
}: CreateAndPublishOpts) => {
  const template = createEvent(kind, {content, tags})
  const event = await sign(template, {anonymous, sk})

  return publish({event, relays, verb, timeout})
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

// Pubkeys

const attempts = new Map<string, number>()

export const getValidPubkeys = (pubkeys: string[], key: string, force = false) => {
  const result = new Set<string>()

  for (const pubkey of pubkeys) {
    if (!pubkey?.match(/^[0-f]{64}$/)) {
      continue
    }

    const person = people.key(pubkey)
    const $person = person.get()
    const tskey = `${key}_fetched_at`
    const ts = $person?.[tskey]

    if (!force) {
      // Avoid multiple concurrent requests
      if (ts > now() - 5) {
        continue
      }

      // If we've tried a few times, slow down with duplicate requests
      if (attempts.get(pubkey) > 3 && ts > now() - seconds(5, "minute")) {
        continue
      }

      // If we have something to show the user, and we checked recently, leave it alone
      if ($person?.[key] && ts > now() - seconds(1, "hour")) {
        continue
      }
    }

    attempts.set(pubkey, inc(attempts.get(pubkey)))
    person.merge({[tskey]: now()})
    result.add(pubkey)
  }

  return Array.from(result)
}

export type LoadPubkeyOpts = {
  force?: boolean
  kinds?: number[]
  relays?: string[]
}

export const loadPubkeyProfiles = (rawPubkeys: string[], opts: LoadPubkeyOpts = {}) => {
  const promises = []
  const filters = [] as Filter[]
  const kinds = without([10002], opts.kinds || personKinds)
  const pubkeys = getValidPubkeys(rawPubkeys, "profile", opts.force)

  if (pubkeys.length === 0) {
    return
  }

  filters.push({kinds: without([30078], kinds)})

  // Add a separate filters for app data so we're not pulling down other people's stuff,
  // or obsolete events of our own.
  if (kinds.includes(30078)) {
    filters.push({kinds: [30078], "#d": Object.values(appDataKeys)})
  }

  promises.push(
    load({
      skipCache: true,
      relays: hints.Indexers(opts.relays || []).getUrls(),
      filters: filters.map(assoc("authors", pubkeys)),
    }),
  )

  for (const {relay, values} of hints.FromPubkeys(pubkeys).getSelections()) {
    promises.push(
      load({
        skipCache: true,
        relays: [relay],
        filters: filters.map(assoc("authors", values)),
      }),
    )
  }

  return Promise.all(promises)
}

export const loadPubkeyRelays = (rawPubkeys: string[], opts: LoadPubkeyOpts = {}) => {
  const promises = []
  const pubkeys = getValidPubkeys(rawPubkeys, "relays", opts.force)

  if (pubkeys.length === 0) {
    return
  }

  promises.push(
    load({
      skipCache: true,
      filters: [{kinds: [10002], authors: pubkeys}],
      relays: hints.Indexers(opts.relays || []).getUrls(),
      onEvent: e => loadPubkeyProfiles([e.pubkey]),
    }),
  )

  for (const {relay, values} of hints.FromPubkeys(pubkeys).getSelections()) {
    promises.push(
      load({
        skipCache: true,
        relays: [relay],
        filters: [{kinds: [10002], authors: values}],
        onEvent: e => loadPubkeyProfiles([e.pubkey]),
      }),
    )
  }

  return Promise.all(promises)
}

export const loadPubkeys = async (pubkeys: string[], opts: LoadPubkeyOpts = {}) =>
  Promise.all([loadPubkeyRelays(pubkeys, opts), loadPubkeyProfiles(pubkeys, opts)])

// Publish

export const uniqTags = tags =>
  uniqBy((t: string[]) => (t[0] === "param" ? t.join(":") : t.slice(0, 2).join(":")), tags)

export const mention = (pubkey: string) =>
  hints.tagPubkey(pubkey).append(displayProfileByPubkey(pubkey)).valueOf()

export const tagsFromContent = (content: string) => {
  const tags = []

  for (const {type, value} of parseContent({content, tags: []})) {
    if (type === "topic") {
      tags.push(["t", value])
    }

    if (type.match(/nostr:(note|nevent)/)) {
      tags.push(["q", value.id, value.relays?.[0] || ""])
    }

    if (type.match(/nostr:(nprofile|npub)/)) {
      tags.push(mention(value.pubkey))
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
  for (const t of hints.tagEvent(parent, mark).valueOf()) {
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
  for (const t of hints.tagEvent(parent, "root").valueOf()) {
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

// DVMs

export type DVMRequestOpts = {
  kind: number
  input?: any
  inputOpts?: string[]
  tags?: string[][]
  relays?: string[]
  timeout?: number
  onPublish?: (pub: Publish) => void
  onProgress?: (e: TrustedEvent) => void
  sk?: string
}

export const dvmRequest = async ({
  kind,
  tags = [],
  timeout = 30_000,
  relays = [],
  onPublish = null,
  onProgress = null,
  sk = null,
}: DVMRequestOpts): Promise<TrustedEvent> => {
  if (relays.length === 0) {
    relays = hints.merge([hints.WriteRelays(), hints.fromRelays(env.get().DVM_RELAYS)]).getUrls()
  }

  tags = tags.concat([["expiration", String(now() + seconds(1, "hour"))]])

  const pub = await createAndPublish({kind, relays, sk, tags})

  onPublish?.(pub)

  return new Promise(resolve => {
    const kinds = [kind + 1000]

    if (onProgress) {
      kinds.push(7000)
    }

    const sub = subscribe({
      relays,
      timeout,
      filters: [
        {
          kinds,
          since: now() - seconds(1, "minute"),
          "#e": [pub.request.event.id],
        },
      ],
      onEvent: (e: TrustedEvent) => {
        if (e.kind === 7000) {
          onProgress?.(e)
        } else {
          resolve(e)
          sub.close()
        }
      },
      onComplete: () => {
        resolve(null)
      },
    })
  })
}

// Thread

const getAncestorIds = e => {
  const {roots, replies} = Tags.fromEvent(e).ancestors()

  return [...roots.values().valueOf(), ...replies.values().valueOf()]
}

export class ThreadLoader {
  stopped = false
  parent = writable<DisplayEvent>(null)
  ancestors = writable<DisplayEvent[]>([])
  root = writable<DisplayEvent>(null)

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
        relays: withFallbacks(this.relays),
        filters: getIdFilters(filteredIds),
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

type Store = {
  name: string
  opts: Record<string, any>
}

class IndexedDB {
  db: any

  constructor(
    readonly dbName: string,
    readonly dbVersion: number,
    readonly stores: Store[],
  ) {}

  open() {
    return new Promise<void>((resolve, reject) => {
      if (!window.indexedDB) {
        reject("Unsupported indexedDB")
      }

      const request = window.indexedDB.open(this.dbName, this.dbVersion)

      request.onsuccess = e => {
        this.db = request.result

        resolve()
      }

      // @ts-ignore
      request.onerror = e => reject(e.target.error)

      request.onupgradeneeded = e => {
        // @ts-ignore
        this.db = e.target.result

        const names = pluck("name", this.stores)

        Array.from(this.db.objectStoreNames as string[]).forEach((name: string) => {
          if (!names.includes(name)) {
            this.db.deleteObjectStore(name)
          }
        })

        this.stores.forEach(o => {
          try {
            this.db.createObjectStore(o.name, o.opts)
          } catch (e) {
            logger.warn(e)
          }
        })
      }
    })
  }

  close() {
    return this.db?.close()
  }

  delete() {
    return new Promise<void>((resolve, reject) => {
      const request = window.indexedDB.deleteDatabase(this.dbName)

      request.onerror = e => reject()
      request.onsuccess = e => resolve()
    })
  }

  getAll(storeName): Promise<any[]> {
    return new Promise((resolve, reject) => {
      const store = this.db.transaction(storeName).objectStore(storeName)
      const request = store.getAll()

      request.onerror = e => reject(e.target.error)
      request.onsuccess = e => resolve(e.target.result)
    })
  }

  async bulkPut(storeName, data) {
    const transaction = this.db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)

    return Promise.all(
      data.map(row => {
        return new Promise((resolve, reject) => {
          const request = store.put(row)

          request.onerror = e => reject(e.target.error)
          request.onsuccess = e => resolve(e.target.result)
        })
      }),
    )
  }

  async bulkDelete(storeName, ids) {
    const transaction = this.db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)

    return Promise.all(
      ids.map(id => {
        return new Promise((resolve, reject) => {
          const request = store.delete(id)

          request.onerror = e => reject(e.target.error)
          request.onsuccess = e => resolve(e.target.result)
        })
      }),
    )
  }

  clear(storeName) {
    return new Promise((resolve, reject) => {
      const request = this.db.transaction(storeName, "readwrite").objectStore(storeName).clear()

      request.onerror = e => reject(e.target.error)
      request.onsuccess = e => resolve(e.target.result)
    })
  }

  count(storeName) {
    return new Promise((resolve, reject) => {
      const request = this.db.transaction(storeName).objectStore(storeName).count()

      request.onerror = e => reject(e.target.error)
      request.onsuccess = e => resolve(e.target.result)
    })
  }
}

class IndexedDBAdapter {
  constructor(
    readonly key: string,
    readonly keyPath: string,
    readonly store: any,
    readonly max: number,
    readonly sort?: (xs: any[]) => any[],
    readonly filter?: (x: any) => boolean,
    readonly migrate?: (xs: any[]) => any[],
  ) {}

  getIndexedDBConfig() {
    return {
      name: this.key,
      opts: {
        keyPath: this.keyPath,
      },
    }
  }

  async initialize(storage: Storage) {
    const {key, keyPath, store, max, sort} = this
    const data = await storage.db.getAll(key)
    const filter = this.filter || identity
    const migrate = this.migrate || identity

    let prev: any[] = migrate(data.filter(filter))

    await store.set(prev)

    store.subscribe(
      throttle(randomInt(3000, 5000), async current => {
        if (storage.dead.get()) {
          return
        }

        current = current.filter(prop(keyPath))

        const prevIds = new Set(prev.map(prop(keyPath)))
        const currentIds = new Set(current.map(prop(keyPath)))
        const newRecords = current.filter(r => !prevIds.has(r[keyPath]))
        const removedRecords = prev.filter(r => !currentIds.has(r[keyPath]))

        if (newRecords.length > 0) {
          await storage.db.bulkPut(key, newRecords)
        }

        if (removedRecords.length > 0) {
          await storage.db.bulkDelete(key, removedRecords.map(prop(keyPath)))
        }

        // If we have much more than our max, prune our store. This will get persisted
        // the next time around.
        if (current.length > max * 1.5) {
          store.set((sort ? sort(current) : current).slice(0, max))
        }

        prev = current
      }),
    )
  }
}

class Storage {
  db: IndexedDB
  ready = defer()
  dead = writable(false)

  constructor(
    readonly version,
    readonly adapters: IndexedDBAdapter[],
  ) {
    this.initialize()
  }

  close = () => {
    this.dead.set(true)

    return this.db?.close()
  }

  clear = () => {
    this.close()

    localStorage.clear()

    return this.db?.delete()
  }

  async initialize() {
    const indexedDBAdapters = this.adapters.filter(
      a => a instanceof IndexedDBAdapter,
    ) as IndexedDBAdapter[]

    if (window.indexedDB) {
      const dbConfig = indexedDBAdapters.map(adapter => adapter.getIndexedDBConfig())

      this.db = new IndexedDB("nostr-engine/Storage", this.version, dbConfig)

      window.addEventListener("beforeunload", () => this.close())

      await this.db.open()
    }

    await Promise.all(this.adapters.map(adapter => adapter.initialize(this)))

    this.ready.resolve()
  }
}

const sortByPubkeyWhitelist = (fallback: (x: any) => number) => (rows: Record<string, any>[]) => {
  const pubkeys = new Set(Object.values(sessions.get()).map(prop("pubkey")))
  const follows = new Set(
    Array.from(pubkeys)
      .flatMap((pk: string) => people.key(pk).get()?.petnames || [])
      .map(nth(1)),
  )

  return sortBy(x => {
    if (pubkeys.has(x.pubkey)) {
      return Number.MAX_SAFE_INTEGER
    }

    if (follows.has(x.pubkey)) {
      return Number.MAX_SAFE_INTEGER - 1
    }

    return fallback(x)
  }, rows)
}

const scoreEvent = e => {
  if (getSession(e.pubkey)) return -Infinity
  if (giftWrapKinds.includes(e.kind)) return -Infinity
  if (reactionKinds.includes(e.kind)) return 0
  if (repostKinds.includes(e.kind)) return 0
  return -e.created_at
}

export const storage = new Storage(12, [
  new IndexedDBAdapter(
    "publishes",
    "id",
    publishes,
    100,
    sortByPubkeyWhitelist(prop("created_at")),
  ),
  new IndexedDBAdapter("topics", "name", topics, 1000, sortBy(prop("last_seen"))),
  new IndexedDBAdapter(
    "people",
    "pubkey",
    people,
    100000,
    sortByPubkeyWhitelist(prop("last_fetched")),
  ),
  new IndexedDBAdapter("relays", "url", relays, 1000, sortBy(prop("count"))),
  new IndexedDBAdapter("channels", "id", channels, 1000, sortBy(prop("last_checked"))),
  new IndexedDBAdapter("groups", "address", groups, 1000, sortBy(prop("count"))),
  new IndexedDBAdapter("groupAlerts", "id", groupAlerts, 30, sortBy(prop("created_at"))),
  new IndexedDBAdapter("groupRequests", "id", groupRequests, 100, sortBy(prop("created_at"))),
  new IndexedDBAdapter(
    "groupSharedKeys",
    "pubkey",
    groupSharedKeys,
    1000,
    sortBy(prop("created_at")),
  ),
  new IndexedDBAdapter("groupAdminKeys", "pubkey", groupAdminKeys, 1000),
  new IndexedDBAdapter("repository", "id", events, 100000, sortBy(scoreEvent)),
])
