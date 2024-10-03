import {uniqBy, sleep, chunk, equals, choice, append} from "@welshman/lib"
import {DELETE, MUTES, FOLLOWS, REACTION, getPubkeyTagValues, createEvent, displayProfile} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import type {SubscribeRequestWithHandlers} from "@welshman/net"
import {
  pubkey,
  repository,
  makeThunk,
  publishThunk,
  loadProfile,
  profilesByPubkey,
  relaySelectionsByPubkey,
  getWriteRelayUrls,
  loadFollows,
  loadMutes,
  getFollows,
  tagEvent,
  tagPubkey,
  tagReactionTo,
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

// Updates

export type ModifyTags = (tags: string[][]) => string[][]

export const updateList = async (kind: number, modifyTags: ModifyTags) => {
  const $pubkey = pubkey.get()!
  const [prev] = repository.query([{kinds: [kind], authors: [$pubkey]}])
  const relays = getWriteRelayUrls(relaySelectionsByPubkey.get().get($pubkey))

  // Preserve content if we have it
  const event = prev
    ? {...prev, tags: modifyTags(prev.tags)}
    : createEvent(kind, {tags: modifyTags([])})

  publishThunk(makeThunk({event, relays}))
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

// Actions

export const publishReaction = ({relays, event, content, tags = []}: {
  relays: string[]
  event: TrustedEvent,
  content: string,
  tags?: string[][]
}) => {
  const reaction = createEvent(REACTION, {
    content,
    tags: [
      ...tags,
      ...tagReactionTo(event),
    ],
  })

  publishThunk(makeThunk({event: reaction, relays}))
}

export const publishDelete = ({relays, event}: {relays: string[], event: TrustedEvent}) => {
  const deleteEvent = createEvent(DELETE, {
    tags: [["k", String(event.kind)], ...tagEvent(event)],
  })

  publishThunk(makeThunk({event: deleteEvent, relays}))
}
