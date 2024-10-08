import {get} from "svelte/store"
import {ctx, uniqBy, uniq, sleep, chunk, equals, choice, append} from "@welshman/lib"
import {
  DELETE,
  PROFILE,
  INBOX_RELAYS,
  RELAYS,
  MUTES,
  FOLLOWS,
  REACTION,
  isSignedEvent,
  createEvent,
  displayProfile,
  normalizeRelayUrl,
} from "@welshman/util"
import type {TrustedEvent, EventTemplate} from "@welshman/util"
import type {SubscribeRequestWithHandlers} from "@welshman/net"
import {Nip59, stamp} from "@welshman/signer"
import {
  pubkey,
  signer,
  repository,
  makeThunk,
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
  tagPubkey,
  tagReactionTo,
  getRelayUrls,
  userInboxRelaySelections,
} from "@welshman/app"
import {tagRoom, MEMBERSHIPS, INDEXER_RELAYS} from "@app/state"

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
      await publishThunk(makeThunk({event, relays}))
    }
  }
}

// List updates

export type ModifyTags = (tags: string[][]) => string[][]

export const updateList = async (kind: number, modifyTags: ModifyTags) => {
  const $pubkey = pubkey.get()!
  const [prev] = repository.query([{kinds: [kind], authors: [$pubkey]}])
  const relays = getWriteRelayUrls(relaySelectionsByPubkey.get().get($pubkey))

  // Preserve content if we have it
  const event = prev
    ? {...prev, tags: modifyTags(prev.tags)}
    : createEvent(kind, {tags: modifyTags([])})

  return publishThunk(makeThunk({event, relays}))
}

export const addSpaceMembership = (url: string) =>
  updateList(MEMBERSHIPS, (tags: string[][]) => uniqBy(t => t.join(""), [...tags, ["r", url]]))

export const addRoomMembership = (url: string, room: string) =>
  updateList(MEMBERSHIPS, (tags: string[][]) =>
    uniqBy(t => t.join(""), [...tags, tagRoom(room, url)]),
  )

export const removeSpaceMembership = (url: string) =>
  updateList(MEMBERSHIPS, (tags: string[][]) =>
    tags.filter(t => !equals(["r", url], t) && t[2] !== url),
  )

export const removeRoomMembership = (url: string, room: string) =>
  updateList(MEMBERSHIPS, (tags: string[][]) => tags.filter(t => !equals(tagRoom(room, url), t)))

export const unfollowPerson = (pubkey: string) =>
  updateList(FOLLOWS, tags => tags.filter(t => t[1] !== pubkey))

export const followPerson = (pubkey: string) =>
  updateList(FOLLOWS, tags => append(tagPubkey(pubkey), tags))

export const unmutePerson = (pubkey: string) =>
  updateList(MUTES, tags => tags.filter(t => t[1] !== pubkey))

export const mutePerson = (pubkey: string) =>
  updateList(MUTES, tags => append(tagPubkey(pubkey), tags))

export const setRelayPolicy = (url: string, read: boolean, write: boolean) =>
  updateList(RELAYS, tags => {
    tags = tags.filter(t => normalizeRelayUrl(t[1]) !== url)

    if (read && write) {
      tags.push(["r", url])
    } else if (read) {
      tags.push(["r", url, "read"])
    } else if (write) {
      tags.push(["r", url, "write"])
    }

    return tags
  })

export const setInboxRelayPolicy = (url: string, enabled: boolean) => {
  const urls = getRelayUrls(get(userInboxRelaySelections))

  // Only update inbox policies if they already exist or we're adding them
  if (enabled || urls.includes(url)) {
    updateList(INBOX_RELAYS, tags => {
      tags = tags.filter(t => normalizeRelayUrl(t[1]) !== url)

      if (enabled) {
        tags.push(["relay", url])
      }

      return tags
    })
  }
}

export const joinRelay = async (url: string, claim?: string) => {
  if (claim) {
    await publishThunk(
      makeThunk({
        event: createEvent(28934, {tags: [["claim", claim]]}),
        relays: [url],
      }),
    )
  }

  await setRelayPolicy(url, true, true)
  await broadcastUserData([url])
}

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
      return publishThunk(
        makeThunk({
          event: await nip59.wrap(recipient, stamp(template)),
          relays: ctx.app.router.PublishMessage(recipient).getUrls(),
        })
      )
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
}) => publishThunk(makeThunk({event: makeReaction({event, content, tags}), relays}))

export const makeDelete = ({event}: {event: TrustedEvent}) =>
  createEvent(DELETE, {tags: [["k", String(event.kind)], ...tagEvent(event)]})

export const publishDelete = ({relays, event}: {relays: string[]; event: TrustedEvent}) =>
  publishThunk(makeThunk({event: makeDelete({event}), relays}))
