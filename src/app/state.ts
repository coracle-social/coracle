import {nip19} from "nostr-tools"
import {get, derived, writable} from "svelte/store"
import type {Maybe} from "@welshman/lib"
import {setContext, max, groupBy, pushToMapKey, nthEq} from "@welshman/lib"
import {
  getIdFilters,
  RELAYS,
  REACTION,
  ZAP_RESPONSE,
  getRelayTagValues,
  getTopicTagValues,
  isShareableRelayUrl,
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

export const MESSAGE = 209

export const REPLY = 210

export const MEMBERSHIPS = 10209

export const INDEXER_RELAYS = ["wss://purplepag.es/", "wss://relay.damus.io/", "wss://nos.lol/"]

export const DUFFLEPUD_URL = "https://dufflepud.onrender.com"

export const REACTION_KINDS = [REACTION, ZAP_RESPONSE]

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
  topicsByUrl: Map<string, string[]>
  event?: TrustedEvent
}

export type PublishedMembership = Omit<Membership, "event"> & {
  event: TrustedEvent
}

export const readMembership = (event: TrustedEvent): PublishedMembership => {
  const topicsByUrl = new Map<string, string[]>()

  for (const tag of event.tags.filter(nthEq(0, "r"))) {
    topicsByUrl.set(tag[1], [])
  }

  for (const tag of event.tags.filter(nthEq(0, "t"))) {
    pushToMapKey(topicsByUrl, tag[2], tag[1])
  }

  return {event, topicsByUrl}
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
  topic: string
  event: TrustedEvent
}

export const readMessage = (event: TrustedEvent): Maybe<Message> => {
  const topics = getTopicTagValues(event.tags)

  if (topics.length > 1) return undefined

  return {topic: topics[0] || "", event}
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
  topic: string
  messages: Message[]
}

export const makeChatId = (url: string, topic: string) => `${url}'${topic}`

export const splitChatId = (id: string) => id.split("'")

export const chats = derived(
  [trackerStore, messages],
  ([$tracker, $messages]) => {
    const messagesByChatId = new Map<string, Message[]>()

    for (const message of $messages) {
      for (const url of $tracker.getRelays(message.event.id)) {
        const chatId = makeChatId(url, message.topic)

        pushToMapKey(messagesByChatId, chatId, message)
      }
    }

    return Array.from(messagesByChatId.entries())
      .map(([id, messages]) => {
        const [url, topic] = splitChatId(id)

        return {id, url, topic, messages}
      })
  }
)

export const {
  indexStore: chatsById,
  deriveItem: deriveChat,
  loadItem: loadChat,
} = collection({
  name: "chats",
  store: chats,
  getKey: chat => chat.id,
  load: (id: string, request: Partial<SubscribeRequestWithHandlers> = {}) => {
    const [url, topic] = splitChatId(id)
    const chat = get(chatsById).get(id)
    const timestamps = chat?.messages.map(m => m.event.created_at) || []
    const since = Math.max(0, max(timestamps) - 3600)

    return load({...request, relays: [url], filters: [{"#t": [topic], since}]})
  },
})

// Topics

export const topicsByUrl = derived(chats, $chats => {
  const $topicsByUrl = new Map<string, string[]>()

  for (const chat of $chats) {
    if (chat.topic) {
      pushToMapKey($topicsByUrl, chat.url, chat.topic)
    }
  }

  return $topicsByUrl
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
