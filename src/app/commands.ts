import {get} from "svelte/store"
import {ctx, uniq, sleep, chunk, equals, choice} from "@welshman/lib"
import {
  DELETE,
  PROFILE,
  INBOX_RELAYS,
  RELAYS,
  FOLLOWS,
  REACTION,
  AUTH_JOIN,
  isSignedEvent,
  createEvent,
  displayProfile,
  normalizeRelayUrl,
  makeList,
  addToListPublicly,
  removeFromListByPredicate,
  getListTags,
  getRelayTags,
  isShareableRelayUrl,
  getRelayTagValues,
} from "@welshman/util"
import type {TrustedEvent, EventTemplate, List} from "@welshman/util"
import type {SubscribeRequestWithHandlers, Subscription} from "@welshman/net"
import {PublishStatus, AuthStatus, SocketStatus} from "@welshman/net"
import {Nip59, makeSecret, stamp, Nip46Broker} from "@welshman/signer"
import type {Nip46Handler} from "@welshman/signer"
import {
  pubkey,
  signer,
  repository,
  publishThunk,
  publishThunks,
  loadProfile,
  loadInboxRelaySelections,
  profilesByPubkey,
  relaySelectionsByPubkey,
  getWriteRelayUrls,
  loadFollows,
  loadMutes,
  tagEvent,
  tagReactionTo,
  getRelayUrls,
  userRelaySelections,
  userInboxRelaySelections,
  nip44EncryptToSelf,
  loadRelay,
  addSession,
  nip46Perms,
  subscribe,
} from "@welshman/app"
import {
  COMMENT,
  tagRoom,
  userMembership,
  MEMBERSHIPS,
  INDEXER_RELAYS,
  loadMembership,
  loadSettings,
  getDefaultPubkeys,
} from "@app/state"

// Utils

export const getPubkeyHints = (pubkey: string) => {
  const selections = relaySelectionsByPubkey.get().get(pubkey)
  const relays = selections ? getWriteRelayUrls(selections) : []
  const hints = relays.length ? relays : INDEXER_RELAYS

  return hints
}

export const getPubkeyPetname = (pubkey: string) => {
  const profile = profilesByPubkey.get().get(pubkey)
  const display = displayProfile(profile)

  return display
}

export const makeMention = (pubkey: string, hints?: string[]) => [
  "p",
  pubkey,
  choice(hints || getPubkeyHints(pubkey)),
  getPubkeyPetname(pubkey),
]

export const makeIMeta = (url: string, data: Record<string, string>) => [
  "imeta",
  `url ${url}`,
  ...Object.entries(data).map(([k, v]) => [k, v].join(" ")),
]

export const subscribePersistent = (request: SubscribeRequestWithHandlers) => {
  let sub: Subscription
  let done = false

  const start = async () => {
    // If the subscription gets closed quickly, don't start flapping
    await Promise.all([
      sleep(30_000),
      new Promise(resolve => {
        sub = subscribe(request)
        sub.emitter.on("close", resolve)
      }),
    ])

    if (!done) {
      start()
    }
  }

  start()

  return () => {
    done = true
    sub?.close()
  }
}

// Log in

export const loginWithNip46 = async (token: string, handler: Nip46Handler) => {
  const secret = makeSecret()
  const broker = Nip46Broker.get({secret, handler})
  const result = await broker.connect(token, nip46Perms)

  if (!result) return false

  const pubkey = await broker.getPublicKey()

  if (!pubkey) return false

  addSession({method: "nip46", pubkey, secret, handler})

  return true
}

// Loaders

export const loadUserData = (
  pubkey: string,
  request: Partial<SubscribeRequestWithHandlers> = {},
) => {
  const promise = Promise.all([
    loadInboxRelaySelections(pubkey, request),
    loadMembership(pubkey, request),
    loadSettings(pubkey, request),
    loadProfile(pubkey, request),
    loadFollows(pubkey, request),
    loadMutes(pubkey, request),
  ])

  // Load followed profiles slowly in the background without clogging other stuff up
  promise.then(async () => {
    for (const pubkeys of chunk(50, getDefaultPubkeys())) {
      await sleep(300)

      for (const pubkey of pubkeys) {
        loadMembership(pubkey)
        loadProfile(pubkey)
        loadFollows(pubkey)
        loadMutes(pubkey)
      }
    }
  })

  return promise
}

export const discoverRelays = (lists: List[]) => {
  const urls = uniq(lists.flatMap(getRelayUrls))

  for (const url of urls) {
    if (isShareableRelayUrl(url)) {
      loadRelay(url)
    }
  }
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

// List updates

export const addSpaceMembership = async (url: string) => {
  const list = get(userMembership) || makeList({kind: MEMBERSHIPS})
  const event = await addToListPublicly(list, ["r", url]).reconcile(nip44EncryptToSelf)
  const relays = uniq([...ctx.app.router.FromUser().getUrls(), ...getRelayTagValues(event.tags)])

  return publishThunk({event, relays}).result
}

export const removeSpaceMembership = async (url: string) => {
  const list = get(userMembership) || makeList({kind: MEMBERSHIPS})
  const pred = (t: string[]) => t[t[0] === "r" ? 1 : 2] === url
  const event = await removeFromListByPredicate(list, pred).reconcile(nip44EncryptToSelf)
  const relays = uniq([...ctx.app.router.FromUser().getUrls(), ...getRelayTagValues(event.tags)])

  return publishThunk({event, relays}).result
}

export const addRoomMembership = async (url: string, room: string) => {
  const list = get(userMembership) || makeList({kind: MEMBERSHIPS})
  const event = await addToListPublicly(list, tagRoom(room, url)).reconcile(nip44EncryptToSelf)
  const relays = uniq([...ctx.app.router.FromUser().getUrls(), ...getRelayTagValues(event.tags)])

  return publishThunk({event, relays}).result
}

export const removeRoomMembership = async (url: string, room: string) => {
  const list = get(userMembership) || makeList({kind: MEMBERSHIPS})
  const pred = (t: string[]) => equals(tagRoom(room, url), t)
  const event = await removeFromListByPredicate(list, pred).reconcile(nip44EncryptToSelf)
  const relays = uniq([...ctx.app.router.FromUser().getUrls(), ...getRelayTagValues(event.tags)])

  return publishThunk({event, relays}).result
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
    relays: ctx.app.router.FromUser().getUrls(),
  }).result
}

export const setInboxRelayPolicy = (url: string, enabled: boolean) => {
  const list = get(userInboxRelaySelections) || makeList({kind: INBOX_RELAYS})

  // Only update inbox policies if they already exist or we're adding them
  if (enabled || getRelayUrls(list).includes(url)) {
    const tags = getRelayTags(getListTags(list)).filter(t => normalizeRelayUrl(t[1]) !== url)

    if (enabled) {
      tags.push(["relay", url])
    }

    return publishThunk({
      event: createEvent(list.kind, {tags}),
      relays: ctx.app.router.FromUser().getUrls(),
    }).result
  }
}

// Relay access

export const checkRelayAccess = async (url: string, claim = "") => {
  const connection = ctx.net.pool.get(url)

  await connection.auth.attempt()

  const thunk = publishThunk({
    event: createEvent(AUTH_JOIN, {tags: [["claim", claim]]}),
    relays: [url],
  })

  const result = await thunk.result

  if (result[url].status !== PublishStatus.Success) {
    const message =
      connection.auth.message?.replace(/^.*: /, "") ||
      result[url].message?.replace(/^.*: /, "") ||
      "join request rejected"

    return `Failed to join relay: ${message}`
  }
}

export const checkRelayProfile = async (url: string) => {
  const relay = await loadRelay(url)

  if (!relay?.profile) {
    return "Sorry, we weren't able to find that relay."
  }
}

export const checkRelayConnection = async (url: string) => {
  const connection = ctx.net.pool.get(url)

  await connection.socket.open()

  if (connection.socket.status !== SocketStatus.Open) {
    return `Failed to connect`
  }
}

export const checkRelayAuth = async (url: string) => {
  const connection = ctx.net.pool.get(url)
  const okStatuses = [AuthStatus.None, AuthStatus.Ok]

  await connection.auth.attempt()

  if (!okStatuses.includes(connection.auth.status)) {
    return `Failed to authenticate: "${connection.auth.message}"`
  }
}

export const attemptRelayAccess = async (url: string, claim = "") =>
  (await checkRelayProfile(url)) ||
  (await checkRelayConnection(url)) ||
  (await checkRelayAccess(url, claim)) ||
  (await checkRelayAuth(url))

// Actions

export const sendWrapped = async ({
  template,
  pubkeys,
  delay,
}: {
  template: EventTemplate
  pubkeys: string[]
  delay?: number
}) => {
  const nip59 = Nip59.fromSigner(signer.get()!)

  return publishThunks(
    await Promise.all(
      uniq(pubkeys).map(async recipient => ({
        event: await nip59.wrap(recipient, stamp(template)),
        relays: ctx.app.router.PubkeyInbox(recipient).getUrls(),
        delay,
      })),
    ),
  )
}

export type ReactionParams = {
  event: TrustedEvent
  content: string
  tags?: string[][]
}

export const makeReaction = ({event, content, tags = []}: ReactionParams) =>
  createEvent(REACTION, {content, tags: [...tags, ...tagReactionTo(event)]})

export const publishReaction = ({relays, ...params}: ReactionParams & {relays: string[]}) =>
  publishThunk({event: makeReaction(params), relays})

export type ReplyParams = {
  event: TrustedEvent
  content: string
  tags?: string[][]
}

export const makeComment = ({event, content, tags = []}: ReplyParams) => {
  const seenRoots = new Set<string>()

  for (const [raw, ...tag] of event.tags.filter(t => t[0].match(/^(k|e|a|i)$/i))) {
    const T = raw.toUpperCase()
    const t = raw.toLowerCase()

    if (seenRoots.has(T)) {
      tags.push([t, ...tag])
    } else {
      tags.push([T, ...tag])
      seenRoots.add(T)
    }
  }

  if (seenRoots.size === 0) {
    tags.push(["K", String(event.kind)])
    tags.push(["E", event.id])
  } else {
    tags.push(["k", String(event.kind)])
    tags.push(["e", event.id])
  }

  return createEvent(COMMENT, {content, tags})
}

export const publishComment = ({relays, ...params}: ReplyParams & {relays: string[]}) =>
  publishThunk({event: makeComment(params), relays})

export const makeDelete = ({event}: {event: TrustedEvent}) =>
  createEvent(DELETE, {tags: [["k", String(event.kind)], ...tagEvent(event)]})

export const publishDelete = ({relays, event}: {relays: string[]; event: TrustedEvent}) =>
  publishThunk({event: makeDelete({event}), relays})
