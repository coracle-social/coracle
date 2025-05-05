import * as nip19 from "nostr-tools/nip19"
import {get} from "svelte/store"
import {randomId, ifLet, poll, uniq, equals, TIMEZONE, LOCALE} from "@welshman/lib"
import type {Feed} from "@welshman/feeds"
import type {TrustedEvent, EventContent} from "@welshman/util"
import {
  DELETE,
  REPORT,
  PROFILE,
  INBOX_RELAYS,
  RELAYS,
  FOLLOWS,
  REACTION,
  AUTH_JOIN,
  GROUP_JOIN,
  GROUP_LEAVE,
  GROUP_CREATE,
  GROUP_EDIT_META,
  GROUPS,
  COMMENT,
  isSignedEvent,
  createEvent,
  displayProfile,
  normalizeRelayUrl,
  makeList,
  addToListPublicly,
  removeFromListByPredicate,
  getTag,
  getListTags,
  getRelayTags,
  getRelayTagValues,
  toNostrURI,
  getRelaysFromList,
  RelayMode,
} from "@welshman/util"
import {Pool, PublishStatus, AuthStatus, SocketStatus} from "@welshman/net"
import {Router} from "@welshman/router"
import {
  pubkey,
  signer,
  repository,
  publishThunk,
  profilesByPubkey,
  relaySelectionsByPubkey,
  tagEvent,
  tagEventForReaction,
  userRelaySelections,
  userInboxRelaySelections,
  nip44EncryptToSelf,
  loadRelay,
  clearStorage,
  dropSession,
  tagEventForComment,
  tagEventForQuote,
  thunkIsComplete,
} from "@welshman/app"
import type {Thunk} from "@welshman/app"
import {
  tagRoom,
  PROTECTED,
  userMembership,
  INDEXER_RELAYS,
  ALERT,
  NOTIFIER_PUBKEY,
  NOTIFIER_RELAY,
  userRoomsByUrl,
} from "@app/state"

// Utils

export const getPubkeyHints = (pubkey: string) => {
  const selections = relaySelectionsByPubkey.get().get(pubkey)
  const relays = selections ? getRelaysFromList(selections, RelayMode.Write) : []
  const hints = relays.length ? relays : INDEXER_RELAYS

  return hints
}

export const getPubkeyPetname = (pubkey: string) => {
  const profile = profilesByPubkey.get().get(pubkey)
  const display = displayProfile(profile)

  return display
}

export const getThunkError = (thunk: Thunk) =>
  new Promise<string>(resolve => {
    thunk.subscribe($thunk => {
      for (const [relay, status] of Object.entries($thunk.status)) {
        if (status === PublishStatus.Failure) {
          resolve($thunk.details[relay])
        }
      }

      if (thunkIsComplete($thunk)) {
        resolve("")
      }
    })
  })

export const prependParent = (parent: TrustedEvent | undefined, {content, tags}: EventContent) => {
  if (parent) {
    const nevent = nip19.neventEncode({
      id: parent.id,
      kind: parent.kind,
      author: parent.pubkey,
      relays: Router.get().Event(parent).limit(3).getUrls(),
    })

    tags = [...tags, tagEventForQuote(parent)]
    content = toNostrURI(nevent) + "\n\n" + content
  }

  return {content, tags}
}

// Log out

export const logout = async () => {
  const $pubkey = pubkey.get()

  if ($pubkey) {
    dropSession($pubkey)
  }

  await clearStorage()

  localStorage.clear()
}

// Synchronization

export const broadcastUserData = async (relays: string[]) => {
  const authors = [pubkey.get()!]
  const kinds = [RELAYS, INBOX_RELAYS, FOLLOWS, PROFILE]
  const events = repository.query([{kinds, authors}])

  for (const event of events) {
    if (isSignedEvent(event)) {
      await publishThunk({event, relays}).result
    }
  }
}

// NIP 29 stuff

export const nip29 = {
  createRoom: (url: string, room: string) => {
    const event = createEvent(GROUP_CREATE, {tags: [tagRoom(room, url)]})

    return publishThunk({event, relays: [url]})
  },
  editMeta: (url: string, room: string, meta: Record<string, string>) => {
    const event = createEvent(GROUP_EDIT_META, {
      tags: [tagRoom(room, url), ...Object.entries(meta)],
    })

    return publishThunk({event, relays: [url]})
  },
  joinRoom: (url: string, room: string) => {
    const event = createEvent(GROUP_JOIN, {tags: [tagRoom(room, url)]})

    return publishThunk({event, relays: [url]})
  },
  leaveRoom: (url: string, room: string) => {
    const event = createEvent(GROUP_LEAVE, {tags: [tagRoom(room, url)]})

    return publishThunk({event, relays: [url]})
  },
}

// List updates

export const addSpaceMembership = async (url: string) => {
  const list = get(userMembership) || makeList({kind: GROUPS})
  const event = await addToListPublicly(list, ["r", url]).reconcile(nip44EncryptToSelf)
  const relays = uniq([...Router.get().FromUser().getUrls(), ...getRelayTagValues(event.tags)])

  return publishThunk({event, relays})
}

export const removeSpaceMembership = async (url: string) => {
  const list = get(userMembership) || makeList({kind: GROUPS})
  const pred = (t: string[]) => t[t[0] === "r" ? 1 : 2] === url
  const event = await removeFromListByPredicate(list, pred).reconcile(nip44EncryptToSelf)
  const relays = uniq([url, ...Router.get().FromUser().getUrls(), ...getRelayTagValues(event.tags)])

  return publishThunk({event, relays})
}

export const addRoomMembership = async (url: string, room: string, name: string) => {
  const list = get(userMembership) || makeList({kind: GROUPS})
  const newTags = [
    ["r", url],
    ["group", room, url, name],
  ]
  const event = await addToListPublicly(list, ...newTags).reconcile(nip44EncryptToSelf)
  const relays = uniq([...Router.get().FromUser().getUrls(), ...getRelayTagValues(event.tags)])

  return publishThunk({event, relays})
}

export const removeRoomMembership = async (url: string, room: string) => {
  const list = get(userMembership) || makeList({kind: GROUPS})
  const pred = (t: string[]) => equals(["group", room, url], t.slice(0, 3))
  const event = await removeFromListByPredicate(list, pred).reconcile(nip44EncryptToSelf)
  const relays = uniq([url, ...Router.get().FromUser().getUrls(), ...getRelayTagValues(event.tags)])

  return publishThunk({event, relays})
}

export const setRelayPolicy = (url: string, read: boolean, write: boolean) => {
  const list = get(userRelaySelections) || makeList({kind: RELAYS})
  const tags = getRelayTags(getListTags(list)).filter(t => normalizeRelayUrl(t[1]) !== url)

  if (read && write) {
    tags.push(["r", url])
  } else if (read) {
    tags.push(["r", url, "read"])
  } else if (write) {
    tags.push(["r", url, "write"])
  }

  return publishThunk({
    event: createEvent(list.kind, {tags}),
    relays: [
      url,
      ...INDEXER_RELAYS,
      ...Router.get().FromUser().getUrls(),
      ...userRoomsByUrl.get().keys(),
    ],
  })
}

export const setInboxRelayPolicy = (url: string, enabled: boolean) => {
  const list = get(userInboxRelaySelections) || makeList({kind: INBOX_RELAYS})

  // Only update inbox policies if they already exist or we're adding them
  if (enabled || getRelaysFromList(list).includes(url)) {
    const tags = getRelayTags(getListTags(list)).filter(t => normalizeRelayUrl(t[1]) !== url)

    if (enabled) {
      tags.push(["relay", url])
    }

    return publishThunk({
      event: createEvent(list.kind, {tags}),
      relays: [
        ...INDEXER_RELAYS,
        ...Router.get().FromUser().getUrls(),
        ...userRoomsByUrl.get().keys(),
      ],
    })
  }
}

// Relay access

export const checkRelayAccess = async (url: string, claim = "") => {
  const socket = Pool.get().get(url)

  await socket.auth.attemptAuth(signer.get().sign)

  const thunk = publishThunk({
    event: createEvent(AUTH_JOIN, {tags: [["claim", claim]]}),
    relays: [url],
  })

  ifLet(await getThunkError(thunk), error => {
    const message =
      socket.auth.details?.replace(/^.*: /, "") ||
      error?.replace(/^.*: /, "") ||
      "join request rejected"

    // If it's a strict NIP 29 relay don't worry about requesting access
    // TODO: remove this if relay29 ever gets less strict
    if (message !== "missing group (`h`) tag") {
      return `Failed to join relay (${message})`
    }
  })
}

export const checkRelayProfile = async (url: string) => {
  const relay = await loadRelay(url)

  if (!relay?.profile) {
    return "Sorry, we weren't able to find that relay."
  }
}

export const checkRelayConnection = async (url: string) => {
  const socket = Pool.get().get(url)

  socket.attemptToOpen()

  await poll({
    signal: AbortSignal.timeout(3000),
    condition: () => socket.status === SocketStatus.Open,
  })

  if (socket.status !== SocketStatus.Open) {
    return `Failed to connect`
  }
}

export const checkRelayAuth = async (url: string, timeout = 3000) => {
  const socket = Pool.get().get(url)
  const okStatuses = [AuthStatus.None, AuthStatus.Ok]

  await socket.auth.attemptAuth(signer.get().sign)

  // Only raise an error if it's not a timeout.
  // If it is, odds are the problem is with our signer, not the relay
  if (!okStatuses.includes(socket.auth.status) && socket.auth.details) {
    return `Failed to authenticate (${socket.auth.details})`
  }
}

export const attemptRelayAccess = async (url: string, claim = "") => {
  const checks = [
    () => checkRelayConnection(url),
    () => checkRelayAccess(url, claim),
    () => checkRelayAuth(url),
  ]

  for (const check of checks) {
    const error = await check()

    if (error) {
      return error
    }
  }
}

// Actions

export const makeDelete = ({event}: {event: TrustedEvent}) => {
  const tags = [["k", String(event.kind)], ...tagEvent(event)]
  const groupTag = getTag("h", event.tags)

  if (groupTag) {
    tags.push(PROTECTED)
    tags.push(groupTag)
  }

  return createEvent(DELETE, {tags})
}

export const publishDelete = ({relays, event}: {relays: string[]; event: TrustedEvent}) =>
  publishThunk({event: makeDelete({event}), relays})

export type ReportParams = {
  event: TrustedEvent
  content: string
  reason: string
}

export const makeReport = ({event, reason, content}: ReportParams) => {
  const tags = [
    ["p", event.pubkey],
    ["e", event.id, reason],
  ]

  return createEvent(REPORT, {content, tags})
}

export const publishReport = ({
  relays,
  event,
  reason,
  content,
}: ReportParams & {relays: string[]}) =>
  publishThunk({event: makeReport({event, reason, content}), relays})

export type ReactionParams = {
  event: TrustedEvent
  content: string
}

export const makeReaction = ({event, content}: ReactionParams) => {
  const tags = tagEventForReaction(event)
  const groupTag = getTag("h", event.tags)

  if (groupTag) {
    tags.push(PROTECTED)
    tags.push(groupTag)
  }

  return createEvent(REACTION, {content, tags})
}

export const publishReaction = ({relays, ...params}: ReactionParams & {relays: string[]}) =>
  publishThunk({event: makeReaction(params), relays})

export type CommentParams = {
  event: TrustedEvent
  content: string
  tags?: string[][]
}

export const makeComment = ({event, content, tags = []}: CommentParams) =>
  createEvent(COMMENT, {content, tags: [...tags, ...tagEventForComment(event)]})

export const publishComment = ({relays, ...params}: CommentParams & {relays: string[]}) =>
  publishThunk({event: makeComment(params), relays})

export type AlertParams = {
  feed: Feed
  cron: string
  email: string
  bunker: string
  secret: string
  description: string
}

export const makeAlert = async ({cron, email, feed, bunker, secret, description}: AlertParams) => {
  const tags = [
    ["feed", JSON.stringify(feed)],
    ["cron", cron],
    ["email", email],
    ["locale", LOCALE],
    ["timezone", TIMEZONE],
    ["description", description],
    ["channel", "email"],
    [
      "handler",
      "31990:97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322:1737058597050",
      "wss://relay.nostr.band/",
      "web",
    ],
  ]

  if (bunker) {
    tags.push(["nip46", secret, bunker])
  }

  return createEvent(ALERT, {
    content: await signer.get().nip44.encrypt(NOTIFIER_PUBKEY, JSON.stringify(tags)),
    tags: [
      ["d", randomId()],
      ["p", NOTIFIER_PUBKEY],
    ],
  })
}

export const publishAlert = async (params: AlertParams) =>
  publishThunk({event: await makeAlert(params), relays: [NOTIFIER_RELAY]})
