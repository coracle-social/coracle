import twColors from "tailwindcss/colors"
import {get, derived, writable} from "svelte/store"
import {nip19} from "nostr-tools"
import type {Maybe} from "@welshman/lib"
import {
  ctx,
  setContext,
  remove,
  assoc,
  sortBy,
  sort,
  uniq,
  partition,
  nth,
  pushToMapKey,
  nthEq,
  shuffle,
  parseJson,
} from "@welshman/lib"
import {
  getIdFilters,
  WRAP,
  REACTION,
  ZAP_RESPONSE,
  DIRECT_MESSAGE,
  getRelayTagValues,
  getPubkeyTagValues,
  isHashedEvent,
  displayProfile,
  readList,
  getListTags,
  asDecryptedEvent,
  isSignedEvent,
  hasValidSignature,
  normalizeRelayUrl,
} from "@welshman/util"
import type {TrustedEvent, SignedEvent, PublishedList, List, Filter} from "@welshman/util"
import {Nip59} from "@welshman/signer"
import {
  pubkey,
  repository,
  load,
  collection,
  profilesByPubkey,
  getDefaultAppContext,
  getDefaultNetContext,
  makeRouter,
  tracker,
  relay,
  getSession,
  getSigner,
  hasNegentropy,
  pull,
  createSearch,
  userFollows,
  ensurePlaintext,
} from "@welshman/app"
import type {AppSyncOpts, Thunk} from "@welshman/app"
import type {SubscribeRequestWithHandlers} from "@welshman/net"
import {deriveEvents, deriveEventsMapped, withGetter} from "@welshman/store"

export const ROOM = "~"

export const GENERAL = "general"

export const MESSAGE = 209

export const THREAD = 309

export const COMMENT = 1111

export const MEMBERSHIPS = 10209

export const INDEXER_RELAYS = [
  "wss://purplepag.es/",
  "wss://relay.damus.io/",
  "wss://relay.nostr.band/",
]

export const SIGNER_RELAYS = ["wss://relay.nsec.app/", "wss://bucket.coracle.social/"]

export const PLATFORM_URL = window.location.origin

export const PLATFORM_LOGO = PLATFORM_URL + "/pwa-192x192.png"

export const PLATFORM_NAME = import.meta.env.VITE_PLATFORM_NAME

export const PLATFORM_RELAY = import.meta.env.VITE_PLATFORM_RELAY

export const PLATFORM_ACCENT = import.meta.env.VITE_PLATFORM_ACCENT

export const PLATFORM_DESCRIPTION = import.meta.env.VITE_PLATFORM_DESCRIPTION

export const DEFAULT_PUBKEYS = import.meta.env.VITE_DEFAULT_PUBKEYS

export const DUFFLEPUD_URL = "https://dufflepud.onrender.com"

export const IMGPROXY_URL = "https://imgproxy.coracle.social"

export const REACTION_KINDS = [REACTION, ZAP_RESPONSE]

export const colors = [
  ["amber", twColors.amber[600]],
  ["blue", twColors.blue[600]],
  ["cyan", twColors.cyan[600]],
  ["emerald", twColors.emerald[600]],
  ["fuchsia", twColors.fuchsia[600]],
  ["green", twColors.green[600]],
  ["indigo", twColors.indigo[600]],
  ["sky", twColors.sky[600]],
  ["lime", twColors.lime[600]],
  ["orange", twColors.orange[600]],
  ["pink", twColors.pink[600]],
  ["purple", twColors.purple[600]],
  ["red", twColors.red[600]],
  ["rose", twColors.rose[600]],
  ["sky", twColors.sky[600]],
  ["teal", twColors.teal[600]],
  ["violet", twColors.violet[600]],
  ["yellow", twColors.yellow[600]],
  ["zinc", twColors.zinc[600]],
]

export const dufflepud = (path: string) => DUFFLEPUD_URL + "/" + path

export const imgproxy = (url: string, {w = 640, h = 1024} = {}) => {
  if (!url || url.match("gif$")) {
    return url
  }

  url = url.split("?")[0]

  try {
    return url ? `${IMGPROXY_URL}/x/s:${w}:${h}/${btoa(url)}` : url
  } catch (e) {
    return url
  }
}

export const entityLink = (entity: string) => `https://coracle.social/${entity}`

export const pubkeyLink = (
  pubkey: string,
  relays = ctx.app.router.FromPubkeys([pubkey]).getUrls(),
) => entityLink(nip19.nprofileEncode({pubkey, relays}))

export const thunks = writable({} as Record<string, Thunk>)

export const tagRoom = (room: string, url: string) => [ROOM, room, url]

export const getDefaultPubkeys = () => {
  const appPubkeys = DEFAULT_PUBKEYS.split(",")
  const userPubkeys = shuffle(getPubkeyTagValues(getListTags(get(userFollows))))

  return userPubkeys.length > 5 ? userPubkeys : [...userPubkeys, ...appPubkeys]
}

export const ensureUnwrapped = async (event: TrustedEvent) => {
  if (event.kind !== WRAP) {
    return event
  }

  let rumor = repository.eventsByWrap.get(event.id)

  if (rumor) {
    return rumor
  }

  for (const recipient of getPubkeyTagValues(event.tags)) {
    const session = getSession(recipient)
    const signer = getSigner(session)

    if (signer) {
      try {
        rumor = await Nip59.fromSigner(signer).unwrap(event as SignedEvent)
        break
      } catch (e) {
        // pass
      }
    }
  }

  if (rumor && isHashedEvent(rumor)) {
    // Copy urls over to the rumor
    tracker.copy(event.id, rumor.id)

    // Send the rumor via our relay so listeners get updated
    relay.send("EVENT", rumor)
  }

  return rumor
}

export const pullConservatively = ({relays, filters}: AppSyncOpts) => {
  const [smart, dumb] = partition(hasNegentropy, relays)
  const promises = [pull({relays: smart, filters})]

  // Since pulling from relays without negentropy is expensive, limit how many
  // duplicates we repeatedly download
  if (dumb.length > 0) {
    const events = sortBy(e => -e.created_at, repository.query(filters))

    if (events.length > 100) {
      filters = filters.map(assoc("since", events[100]!.created_at))
    }

    promises.push(pull({relays: dumb, filters}))
  }

  return Promise.all(promises)
}

setContext({
  net: getDefaultNetContext({
    isValid: (url: string, event: TrustedEvent) => {
      if (!isSignedEvent(event) || !hasValidSignature(event)) {
        return false
      }

      const roomTags = event.tags.filter(nthEq(0, "~"))

      if (roomTags.length > 0 && !roomTags.some(nthEq(2, url))) {
        return false
      }

      return true
    },
  }),
  app: getDefaultAppContext({
    dufflepudUrl: DUFFLEPUD_URL,
    indexerRelays: INDEXER_RELAYS,
    requestTimeout: 5000,
    router: makeRouter(),
  }),
})

export const deriveEvent = (idOrAddress: string, hints: string[] = []) => {
  let attempted = false

  const filters = getIdFilters([idOrAddress])
  const relays = [...hints, ...INDEXER_RELAYS]

  return derived(
    deriveEvents(repository, {filters, includeDeleted: true}),
    (events: TrustedEvent[]) => {
      if (!attempted && events.length === 0) {
        load({relays, filters})
        attempted = true
      }

      return events[0]
    },
  )
}

export const deriveEventsForUrl = (url: string, filters: Filter[]) =>
  derived(deriveEvents(repository, {filters}), $events =>
    sortBy(
      e => -e.created_at,
      $events.filter(e => e.tags.find(nthEq(0, "~"))?.[2] === url),
    ),
  )

// Settings

export const SETTINGS = 38489

export type Settings = {
  event: TrustedEvent
  values: {
    show_media: boolean
    hide_sensitive: boolean
    send_delay: number
  }
}

export const defaultSettings = {
  show_media: true,
  hide_sensitive: true,
  send_delay: 3000,
}

export const settings = deriveEventsMapped<Settings>(repository, {
  filters: [{kinds: [SETTINGS]}],
  itemToEvent: item => item.event,
  eventToItem: async (event: TrustedEvent) => ({
    event,
    values: {...defaultSettings, ...parseJson(await ensurePlaintext(event))},
  }),
})

export const {
  indexStore: settingsByPubkey,
  deriveItem: deriveSettings,
  loadItem: loadSettings,
} = collection({
  name: "settings",
  store: settings,
  getKey: settings => settings.event.pubkey,
  load: (pubkey: string, request: Partial<SubscribeRequestWithHandlers> = {}) =>
    load({...request, filters: [{kinds: [SETTINGS], authors: [pubkey]}]}),
})

// Membership

export const hasMembershipUrl = (list: List | undefined, url: string) =>
  getListTags(list).some(t => {
    if (t[0] === "r") return t[1] === url
    if (t[0] === "~") return t[2] === url

    return false
  })

export const getMembershipUrls = (list?: List) => sort(getRelayTagValues(getListTags(list)))

export const getMembershipRooms = (list?: List) =>
  getListTags(list)
    .filter(t => t[0] === "~")
    .map(t => ({url: t[2], room: t[1]}))

export const getMembershipRoomsByUrl = (url: string, list?: List) =>
  sort(
    getListTags(list)
      .filter(t => t[0] === "~" && t[2] === url)
      .map(nth(1)),
  )

export const memberships = deriveEventsMapped<PublishedList>(repository, {
  filters: [{kinds: [MEMBERSHIPS]}],
  itemToEvent: item => item.event,
  eventToItem: (event: TrustedEvent) => readList(asDecryptedEvent(event)),
})

export const {
  indexStore: membershipByPubkey,
  deriveItem: deriveMembership,
  loadItem: loadMembership,
} = collection({
  name: "memberships",
  store: memberships,
  getKey: list => list.event.pubkey,
  load: (pubkey: string, request: Partial<SubscribeRequestWithHandlers> = {}) =>
    load({
      ...request,
      filters: [{kinds: [MEMBERSHIPS], authors: [pubkey]}],
    }),
})

// Messages

export type ChannelMessage = {
  url: string
  room: string
  event: TrustedEvent
}

export const readMessage = (event: TrustedEvent): Maybe<ChannelMessage> => {
  const roomTags = event.tags.filter(nthEq(0, ROOM))

  if (roomTags.length !== 1) return undefined

  const [_, room, url] = roomTags[0]

  if (!url || !room) return undefined

  return {url: normalizeRelayUrl(url), room, event}
}

export const channelMessages = deriveEventsMapped<ChannelMessage>(repository, {
  filters: [{kinds: [MESSAGE, COMMENT]}],
  eventToItem: readMessage,
  itemToEvent: item => item.event,
})

// Channels

export type Channel = {
  id: string
  url: string
  room: string
  messages: ChannelMessage[]
}

export const makeChannelId = (url: string, room: string) => `${url}|${room}`

export const splitChannelId = (id: string) => id.split("|")

export const channels = derived(
  [memberships, channelMessages],
  ([$memberships, $channelMessages]) => {
    const messagesByChannelId = new Map<string, ChannelMessage[]>()

    // Add known rooms by membership so we don't have to scan messages to load all rooms
    for (const membership of $memberships) {
      for (const {url, room} of getMembershipRooms(membership)) {
        messagesByChannelId.set(makeChannelId(url, room), [])
      }
    }

    // Add messages/rooms without memberships
    for (const message of $channelMessages) {
      pushToMapKey(messagesByChannelId, makeChannelId(message.url, message.room), message)
    }

    return Array.from(messagesByChannelId.entries()).map(([id, messages]) => {
      const [url, room] = splitChannelId(id)

      return {id, url, room, messages}
    })
  },
)

export const {
  indexStore: channelsById,
  deriveItem: deriveChannel,
  loadItem: loadChannel,
} = collection({
  name: "channels",
  store: channels,
  getKey: channel => channel.id,
  load: (id: string, request: Partial<SubscribeRequestWithHandlers> = {}) => {
    const [url, room] = splitChannelId(id)

    return load({...request, relays: [url], filters: [{"#~": [room]}]})
  },
})

// Chats

export const chatMessages = deriveEvents(repository, {filters: [{kinds: [DIRECT_MESSAGE]}]})

export type Chat = {
  id: string
  pubkeys: string[]
  messages: TrustedEvent[]
  last_activity: number
  search_text: string
}

export const makeChatId = (pubkeys: string[]) => sort(uniq(pubkeys)).join(",")

export const splitChatId = (id: string) => id.split(",")

export const chats = derived(
  [pubkey, chatMessages, profilesByPubkey],
  ([$pubkey, $messages, $profilesByPubkey]) => {
    const messagesByChatId = new Map<string, TrustedEvent[]>()

    for (const message of $messages) {
      const chatId = makeChatId(getPubkeyTagValues(message.tags).concat(message.pubkey))

      pushToMapKey(messagesByChatId, chatId, message)
    }

    return sortBy(
      c => -c.last_activity,
      Array.from(messagesByChatId.entries()).map(([id, events]): Chat => {
        const pubkeys = splitChatId(id)
        const messages = sortBy(e => -e.created_at, events)
        const last_activity = messages[0].created_at
        const search_text = remove($pubkey as string, pubkeys)
          .map(pubkey => {
            const profile = $profilesByPubkey.get(pubkey)

            return profile ? displayProfile(profile) : ""
          })
          .join(" ")

        return {id, pubkeys, messages, last_activity, search_text}
      }),
    )
  },
)

export const {
  indexStore: chatsById,
  deriveItem: deriveChat,
  loadItem: loadChat,
} = collection({
  name: "chats",
  store: chats,
  getKey: chat => chat.id,
})

export const chatSearch = derived(chats, $chats =>
  createSearch($chats, {
    getValue: (chat: Chat) => chat.id,
    fuseOptions: {keys: ["search_text"]},
  }),
)

// Rooms

export const roomsByUrl = derived(channels, $channels => {
  const $roomsByUrl = new Map<string, string[]>()

  for (const channel of $channels) {
    if (channel.room) {
      pushToMapKey($roomsByUrl, channel.url, channel.room)
    }
  }

  return $roomsByUrl
})

// User stuff

export const userSettings = withGetter(
  derived([pubkey, settingsByPubkey], ([$pubkey, $settingsByPubkey]) => {
    if (!$pubkey) return undefined

    loadSettings($pubkey)

    return $settingsByPubkey.get($pubkey)
  }),
)

export const userSettingValues = derived(userSettings, $s => $s?.values || defaultSettings)

export const userMembership = withGetter(
  derived([pubkey, membershipByPubkey], ([$pubkey, $membershipByPubkey]) => {
    if (!$pubkey) return undefined

    loadMembership($pubkey)

    return $membershipByPubkey.get($pubkey)
  }),
)

// Other utils

export const encodeRelay = (url: string) => encodeURIComponent(normalizeRelayUrl(url))

export const decodeRelay = (url: string) => normalizeRelayUrl(decodeURIComponent(url))

export const displayReaction = (content: string) => {
  if (!content || content === "+") return "❤️"
  if (content === "-") return "👎"
  return content
}
