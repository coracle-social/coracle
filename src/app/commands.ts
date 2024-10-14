import {get} from "svelte/store"
import {ctx, uniq, sleep, chunk, equals, choice} from "@welshman/lib"
import {
  DELETE,
  PROFILE,
  INBOX_RELAYS,
  RELAYS,
  FOLLOWS,
  REACTION,
  isSignedEvent,
  createEvent,
  displayProfile,
  normalizeRelayUrl,
  makeList,
  addToListPublicly,
  removeFromListByPredicate,
  getListTags,
  getRelayTags,
} from "@welshman/util"
import type {TrustedEvent, EventTemplate} from "@welshman/util"
import type {SubscribeRequestWithHandlers} from "@welshman/net"
import {PublishStatus, AuthStatus, ConnectionStatus} from "@welshman/net"
import {Nip59, stamp} from "@welshman/signer"
import {
  pubkey,
  signer,
  repository,
  publishThunk,
  loadProfile,
  loadInboxRelaySelections,
  profilesByPubkey,
  relaySelectionsByPubkey,
  getWriteRelayUrls,
  loadFollows,
  loadMutes,
  getFollows,
  tagEvent,
  tagReactionTo,
  getRelayUrls,
  userRelaySelections,
  userInboxRelaySelections,
  nip44EncryptToSelf,
  loadRelay,
} from "@welshman/app"
import {tagRoom, userMembership, MEMBERSHIPS, INDEXER_RELAYS, loadMembership} from "@app/state"

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

// Loaders

export const loadUserData = (
  pubkey: string,
  request: Partial<SubscribeRequestWithHandlers> = {},
) => {
  const promise = Promise.all([
    loadInboxRelaySelections(pubkey, request),
    loadMembership(pubkey, request),
    loadProfile(pubkey, request),
    loadFollows(pubkey, request),
    loadMutes(pubkey, request),
  ])

  // Load followed profiles slowly in the background without clogging other stuff up
  promise.then(async () => {
    for (const pubkeys of chunk(50, getFollows(pubkey))) {
      await sleep(300)

      for (const pubkey of pubkeys) {
        loadProfile(pubkey)
        loadFollows(pubkey)
        loadMutes(pubkey)
      }
    }
  })

  return promise
}

// Synchronization

export const broadcastUserData = async (relays: string[]) => {
  const authors = [pubkey.get()!]
  const kinds = [RELAYS, INBOX_RELAYS, FOLLOWS, PROFILE]
  const events = repository.query([{kinds, authors}])

  for (const event of events) {
    if (isSignedEvent(event)) {
      await publishThunk({event, relays})
    }
  }
}

// List updates

export const addSpaceMembership = async (url: string) => {
  const list = get(userMembership) || makeList({kind: MEMBERSHIPS})
  const event = await addToListPublicly(list, ["r", url]).reconcile(nip44EncryptToSelf)

  return publishThunk({event, relays: ctx.app.router.WriteRelays().getUrls()})
}

export const removeSpaceMembership = async (url: string) => {
  const list = get(userMembership) || makeList({kind: MEMBERSHIPS})
  const pred = (t: string[]) => equals(["r", url], t) || t[2] !== url
  const event = await removeFromListByPredicate(list, pred).reconcile(nip44EncryptToSelf)

  return publishThunk({event, relays: ctx.app.router.WriteRelays().getUrls()})
}

export const addRoomMembership = async (url: string, room: string) => {
  const list = get(userMembership) || makeList({kind: MEMBERSHIPS})
  const event = await addToListPublicly(list, tagRoom(room, url)).reconcile(nip44EncryptToSelf)

  return publishThunk({event, relays: ctx.app.router.WriteRelays().getUrls()})
}

export const removeRoomMembership = async (url: string, room: string) => {
  const list = get(userMembership) || makeList({kind: MEMBERSHIPS})
  const pred = (t: string[]) => equals(tagRoom(room, url), t)
  const event = await removeFromListByPredicate(list, pred).reconcile(nip44EncryptToSelf)

  return publishThunk({event, relays: ctx.app.router.WriteRelays().getUrls()})
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
    relays: ctx.app.router.WriteRelays().getUrls(),
  })
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
      relays: ctx.app.router.WriteRelays().getUrls(),
    })
  }
}

// Relay access

export const checkRelayAccess = async (url: string, claim = "") => {
  const connection =  ctx.net.pool.get(url)

  await connection.auth.attemptIfRequested()
  await connection.auth.waitIfPending()

  const result = await publishThunk({
    event: createEvent(28934, {tags: [["claim", claim]]}),
    relays: [url],
  })

  if (result[url].status !== PublishStatus.Success) {
    const message = result[url].message?.replace(/^.*: /, "") || "join request rejected"

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
  const okStatuses = [ConnectionStatus.Ok, ConnectionStatus.Slow]

  await connection.ensureConnected()

  if (!okStatuses.includes(connection.meta.getStatus())) {
    return `Failed to connect`
  }
}

export const checkRelayAuth = async (url: string) => {
  const connection = ctx.net.pool.get(url)
  const okStatuses = [AuthStatus.None, AuthStatus.Ok]

  await connection.auth.attemptIfRequested()
  await connection.auth.waitIfPending()

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
}: {
  template: EventTemplate
  pubkeys: string[]
}) => {
  const nip59 = Nip59.fromSigner(signer.get()!)

  await Promise.all(
    uniq(pubkeys).map(async recipient => {
      return publishThunk({
        event: await nip59.wrap(recipient, stamp(template)),
        relays: ctx.app.router.PublishMessage(recipient).getUrls(),
      })
    }),
  )
}

export const makeReaction = ({
  event,
  content,
  tags = [],
}: {
  event: TrustedEvent
  content: string
  tags?: string[][]
}) =>
  createEvent(REACTION, {
    content,
    tags: [...tags, ...tagReactionTo(event)],
  })

export const publishReaction = ({
  relays,
  event,
  content,
  tags = [],
}: {
  relays: string[]
  event: TrustedEvent
  content: string
  tags?: string[][]
}) => publishThunk({event: makeReaction({event, content, tags}), relays})

export const makeDelete = ({event}: {event: TrustedEvent}) =>
  createEvent(DELETE, {tags: [["k", String(event.kind)], ...tagEvent(event)]})

export const publishDelete = ({relays, event}: {relays: string[]; event: TrustedEvent}) =>
  publishThunk({event: makeDelete({event}), relays})
