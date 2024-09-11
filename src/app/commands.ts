import {uniqBy, equals, uniq, now, choice} from "@welshman/lib"
import {getRelayTagValues, createEvent, displayProfile} from "@welshman/util"
import {PublishStatus} from "@welshman/net"
import {
  pubkey,
  repository,
  load,
  makeThunk,
  publishThunk,
  loadProfile,
  profilesByPubkey,
  relaySelectionsByPubkey,
  loadRelaySelections,
  getWriteRelayUrls,
  loadFollows,
  loadMutes,
} from "@welshman/app"
import {MEMBERSHIPS, INDEXER_RELAYS} from "@app/state"

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

export const loadUserData = (pubkey: string, hints: string[] = []) =>
  Promise.all([loadProfile(pubkey), loadFollows(pubkey), loadMutes(pubkey)])

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

export const addRoomMembership = (url: string, topic: string) =>
  updateList(MEMBERSHIPS, (tags: string[][]) => uniqBy(t => t.join(""), [...tags, ["t", topic, url]]))

export const removeSpaceMembership = (url: string) =>
  updateList(MEMBERSHIPS, (tags: string[][]) => tags.filter(t => !equals(["r", url], t) && t[2] !== url))

export const removeRoomMembership = (url: string, topic: string) =>
  updateList(MEMBERSHIPS, (tags: string[][]) => tags.filter(t => !equals(["t", topic, url], t)))
