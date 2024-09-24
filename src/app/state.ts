import {nip19} from "nostr-tools"
import {get, derived} from "svelte/store"
import type {Maybe} from "@welshman/lib"
import {setContext, partition, nth, max, pushToMapKey, nthEq} from "@welshman/lib"
import {
  getIdFilters,
  NOTE,
  RELAYS,
  REACTION,
  ZAP_RESPONSE,
  EVENT_DATE,
  EVENT_TIME,
  getRelayTagValues,
  isShareableRelayUrl,
  getAncestorTags,
  getAncestorTagValues,
} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {
  pubkey,
  repository,
  load,
  subscribe,
  collection,
  loadRelay,
  loadProfile,
  profilesByPubkey,
  getDefaultAppContext,
  getDefaultNetContext,
  makeRouter,
  trackerStore,
} from "@welshman/app"
import type {SubscribeRequestWithHandlers} from "@welshman/net"
import {deriveEvents, deriveEventsMapped, withGetter} from "@welshman/store"

export const ROOM = "~"

export const GENERAL = "general"

export const MESSAGE = 209

export const REPLY = 1111

export const MEMBERSHIPS = 10209

export const INDEXER_RELAYS = [
  "wss://purplepag.es/",
  "wss://relay.damus.io/",
  "wss://relay.nostr.band/",
]

export const DUFFLEPUD_URL = "https://dufflepud.onrender.com"

export const IMGPROXY_URL = "https://imgproxy.coracle.social"

export const REACTION_KINDS = [REACTION, ZAP_RESPONSE]

export const dufflepud = (path: string) => DUFFLEPUD_URL + '/' + path

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

setContext({
  net: getDefaultNetContext(),
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

// Membership

export type Membership = {
  roomsByUrl: Map<string, string[]>
  event?: TrustedEvent
}

export type PublishedMembership = Omit<Membership, "event"> & {
  event: TrustedEvent
}

export const readMembership = (event: TrustedEvent): PublishedMembership => {
  const roomsByUrl = new Map<string, string[]>()

  for (const tag of event.tags.filter(nthEq(0, "r"))) {
    roomsByUrl.set(tag[1], [])
  }

  for (const tag of event.tags.filter(nthEq(0, "~"))) {
    pushToMapKey(roomsByUrl, tag[2], tag[1])
  }

  return {event, roomsByUrl}
}

export const memberships = deriveEventsMapped<PublishedMembership>(repository, {
  filters: [{kinds: [MEMBERSHIPS]}],
  eventToItem: readMembership,
  itemToEvent: item => item.event,
})

export const {
  indexStore: membershipByPubkey,
  deriveItem: deriveMembership,
  loadItem: loadMembership,
} = collection({
  name: "memberships",
  store: memberships,
  getKey: membership => membership.event.pubkey,
  load: (pubkey: string, request: Partial<SubscribeRequestWithHandlers> = {}) =>
    load({
      ...request,
      filters: [{kinds: [MEMBERSHIPS], authors: [pubkey]}],
    }),
})

// Messages

export type Message = {
  room: string
  event: TrustedEvent
}

export const readMessage = (event: TrustedEvent): Maybe<Message> => {
  const rooms = event.tags.filter(nthEq(0, ROOM)).map(nth(1))

  if (rooms.length > 1) return undefined

  return {room: rooms[0] || "", event}
}

export const messages = deriveEventsMapped<Message>(repository, {
  filters: [{kinds: [MESSAGE, REPLY]}],
  eventToItem: readMessage,
  itemToEvent: item => item.event,
})

// Chats

export type Chat = {
  id: string
  url: string
  room: string
  messages: Message[]
}

export const makeChatId = (url: string, room: string) => `${url}'${room}`

export const splitChatId = (id: string) => id.split("'")

export const chats = derived([trackerStore, messages], ([$tracker, $messages]) => {
  const messagesByChatId = new Map<string, Message[]>()

  for (const message of $messages) {
    for (const url of $tracker.getRelays(message.event.id)) {
      const chatId = makeChatId(url, message.room)

      pushToMapKey(messagesByChatId, chatId, message)
    }
  }

  return Array.from(messagesByChatId.entries()).map(([id, messages]) => {
    const [url, room] = splitChatId(id)

    return {id, url, room, messages}
  })
})

export const {
  indexStore: chatsById,
  deriveItem: deriveChat,
  loadItem: loadChat,
} = collection({
  name: "chats",
  store: chats,
  getKey: chat => chat.id,
  load: (id: string, request: Partial<SubscribeRequestWithHandlers> = {}) => {
    const [url, room] = splitChatId(id)
    const chat = get(chatsById).get(id)
    const timestamps = chat?.messages.map(m => m.event.created_at) || []
    const since = Math.max(0, max(timestamps) - 3600)

    return load({...request, relays: [url], filters: [{"#~": [room], since}]})
  },
})

// Calendar events

export const events = deriveEvents(repository, {filters: [{kinds: [EVENT_DATE, EVENT_TIME]}]})

export const eventsByUrl = derived([trackerStore, events], ([$tracker, $events]) => {
  const eventsByUrl = new Map<string, TrustedEvent[]>()

  for (const event of $events) {
    for (const url of $tracker.getRelays(event.id)) {
      pushToMapKey(eventsByUrl, url, event)
    }
  }

  return eventsByUrl
})

// Threads

export type Thread = {
  root: TrustedEvent
  replies: TrustedEvent[]
}

export const notes = deriveEvents(repository, {filters: [{kinds: [NOTE]}]})

export const threadsByUrl = derived([trackerStore, notes], ([$tracker, $notes]) => {
  const threadsByUrl = new Map<string, Thread[]>()
  const [parents, children] = partition(e => getAncestorTags(e.tags).replies.length === 0, $notes)

  for (const event of parents) {
    for (const url of $tracker.getRelays(event.id)) {
      pushToMapKey(threadsByUrl, url, {root: event, replies: []})
    }
  }

  for (const event of children) {
    const [id] = getAncestorTagValues(event.tags).replies

    for (const url of $tracker.getRelays(event.id)) {
      const threads = threadsByUrl.get(url) || []
      const thread = threads.find(thread => thread.root.id === id)

      if (!thread) {
        continue
      }

      thread.replies.push(event)
    }
  }

  return threadsByUrl
})

// Rooms

export const roomsByUrl = derived(chats, $chats => {
  const $roomsByUrl = new Map<string, string[]>()

  for (const chat of $chats) {
    if (chat.room) {
      pushToMapKey($roomsByUrl, chat.url, chat.room)
    }
  }

  return $roomsByUrl
})

// User stuff

export const userProfile = derived([pubkey, profilesByPubkey], ([$pubkey, $profilesByPubkey]) => {
  if (!$pubkey) return null

  loadProfile($pubkey)

  return $profilesByPubkey.get($pubkey)
})

export const userMembership = withGetter(
  derived([pubkey, membershipByPubkey], ([$pubkey, $membershipByPubkey]) => {
    if (!$pubkey) return null

    loadMembership($pubkey)

    return $membershipByPubkey.get($pubkey)
  }),
)

// Other utils

export const decodeNRelay = (nevent: string) => nip19.decode(nevent).data as string

export const displayReaction = (content: string) => {
  if (content === "+") return "❤️"
  if (content === "-") return "👎"
  return content
}

export const discoverRelays = () =>
  subscribe({
    filters: [{kinds: [RELAYS]}],
    onEvent: (event: TrustedEvent) => {
      for (const url of getRelayTagValues(event.tags)) {
        if (isShareableRelayUrl(url)) {
          loadRelay(url)
        }
      }
    },
  })
