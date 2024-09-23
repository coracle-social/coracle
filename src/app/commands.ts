import {uniqBy, sleep, chunk, equals, choice} from "@welshman/lib"
import {getPubkeyTagValues, createEvent, displayProfile} from "@welshman/util"
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
  followsByPubkey,
} from "@welshman/app"
import {ROOM, MEMBERSHIPS, INDEXER_RELAYS} from "@app/state"

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
    const followsList = followsByPubkey.get().get(pubkey)
    const follows = getPubkeyTagValues(followsList?.event.tags || [])

    for (const pubkeys of chunk(50, follows)) {
      await sleep(300)

      for (const pubkey of pubkeys) {
        loadProfile(pubkey)
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
    uniqBy(t => t.join(""), [...tags, [ROOM, room, url]]),
  )

export const removeSpaceMembership = (url: string) =>
  updateList(MEMBERSHIPS, (tags: string[][]) =>
    tags.filter(t => !equals(["r", url], t) && t[2] !== url),
  )

export const removeRoomMembership = (url: string, room: string) =>
  updateList(MEMBERSHIPS, (tags: string[][]) => tags.filter(t => !equals([ROOM, room, url], t)))
