import {nip19} from "nostr-tools"
import twColors from "tailwindcss/colors"
import {get, derived} from "svelte/store"
import type {Maybe} from "@welshman/lib"
import {
  setContext,
  remove,
  assoc,
  sortBy,
  sort,
  uniq,
  partition,
  nth,
  max,
  pushToMapKey,
  nthEq,
} from "@welshman/lib"
import {
  getIdFilters,
  NOTE,
  WRAP,
  RELAYS,
  REACTION,
  ZAP_RESPONSE,
  DIRECT_MESSAGE,
  EVENT_DATE,
  EVENT_TIME,
  getRelayTagValues,
  isShareableRelayUrl,
  getAncestorTags,
  getAncestorTagValues,
  getPubkeyTagValues,
  isHashedEvent,
  displayProfile,
} from "@welshman/util"
import type {TrustedEvent, SignedEvent} from "@welshman/util"
import {Nip59} from "@welshman/signer"
import {
  pubkey,
  repository,
  load,
  subscribe,
  collection,
  loadRelay,
  profilesByPubkey,
  getDefaultAppContext,
  getDefaultNetContext,
  makeRouter,
  trackerStore,
  tracker,
  relay,
  getSession,
  getSigner,
  hasNegentropy,
  pull,
  createSearch,
} from "@welshman/app"
import type {AppSyncOpts} from "@welshman/app"
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

export const tagRoom = (room: string, url: string) => [ROOM, room, url]

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
    tracker.copy(event.id, rumor.id)
    relay.send("EVENT", rumor)
  }

  return rumor
}

export const pullConservatively = ({relays, filters}: AppSyncOpts) => {
  const [smart, dumb] = partition(hasNegentropy, relays)
  const promises = [pull({relays: smart, filters})]

  // Since pulling from relays without negentropy is expensive, only do it 30% of the time,
  // unless we have very few matching events. If that's the case, either we haven't synced
  // this filter yet, or there are few enough events that we don't really need to worry about
  // downloading duplicates. Otherwise, add a reasonable since value to make sure we at
  // least fetch recent events.
  if (Math.random() > 0.7 || repository.query(filters).length < 100) {
    promises.push(pull({relays: dumb, filters}))
  } else {
    const events = sortBy(e => -e.created_at, repository.query(filters))
    const since = events[50]!.created_at

    promises.push(pull({relays: dumb, filters: filters.map(assoc("since", since))}))
  }

  return Promise.all(promises)
}

setContext({
  net: getDefaultNetContext(),
  app: getDefaultAppContext({
    dufflepudUrl: DUFFLEPUD_URL,
    indexerRelays: INDEXER_RELAYS,
    requestTimeout: 5000,
    router: makeRouter(),
  }),
})

repository.on("update", ({added}) => {
  for (const event of added) {
    ensureUnwrapped(event)
  }
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

export type ChannelMessage = {
  room: string
  event: TrustedEvent
}

export const readMessage = (event: TrustedEvent): Maybe<ChannelMessage> => {
  const rooms = event.tags.filter(nthEq(0, ROOM)).map(nth(1))

  if (rooms.length > 1) return undefined

  return {room: rooms[0] || "", event}
}

export const channelMessages = deriveEventsMapped<ChannelMessage>(repository, {
  filters: [{kinds: [MESSAGE, REPLY]}],
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

export const makeChannelId = (url: string, room: string) => `${url}'${room}`

export const splitChannelId = (id: string) => id.split("'")

export const channels = derived([trackerStore, channelMessages], ([$tracker, $channelMessages]) => {
  const messagesByChannelId = new Map<string, ChannelMessage[]>()

  for (const message of $channelMessages) {
    for (const url of $tracker.getRelays(message.event.id)) {
      const channelId = makeChannelId(url, message.room)

      pushToMapKey(messagesByChannelId, channelId, message)
    }
  }

  return Array.from(messagesByChannelId.entries()).map(([id, messages]) => {
    const [url, room] = splitChannelId(id)

    return {id, url, room, messages}
  })
})

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
    const channel = get(channelsById).get(id)
    const timestamps = channel?.messages.map(m => m.event.created_at) || []
    const since = Math.max(0, max(timestamps) - 3600)

    return load({...request, relays: [url], filters: [{"#~": [room], since}]})
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
      const chatId = makeChatId(getPubkeyTagValues(message.tags))

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
  load: async (id: string, request: Partial<SubscribeRequestWithHandlers> = {}) => {
    const $pubkey = pubkey.get()
    const chat = get(chatsById).get(id)
    const timestamps = chat?.messages.map(e => e.created_at) || []
    const since = Math.max(0, max(timestamps) - 3600)

    if ($pubkey) {
      await load({...request, filters: [{kinds: [WRAP], "#p": [$pubkey], since}]})
    }
  },
})

export const chatSearch = derived(chats, $chats =>
  createSearch($chats, {
    getValue: (chat: Chat) => chat.id,
    fuseOptions: {keys: ["search_text"]},
  }),
)

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
