import {uniqBy, uniq, now, choice} from "@welshman/lib"
import {
  GROUPS,
  GROUP_JOIN,
  getGroupTags,
  getRelayTagValues,
  createEvent,
  displayProfile,
} from "@welshman/util"
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
import {loadGroup, loadGroupMembership, INDEXER_RELAYS} from "@app/state"

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
  Promise.all([
    loadProfile(pubkey),
    loadFollows(pubkey),
    loadMutes(pubkey),
  ])

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

export const addGroupMemberships = (newTags: string[][]) =>
  updateList(GROUPS, (tags: string[][]) => uniqBy(t => t.join(""), [...tags, ...newTags]))

export const removeGroupMemberships = (noms: string[]) =>
  updateList(GROUPS, (tags: string[][]) => tags.filter(t => !noms.includes(t[1])))

export const sendJoinRequest = async (nom: string, url: string): Promise<[boolean, string]> => {
  const relays = [url]
  const filters = [{kinds: [9000], "#h": [nom], "#p": [pubkey.get()!], since: now() - 30}]

  const event = createEvent(GROUP_JOIN, {tags: [["h", nom]]})
  const statusData = await publishThunk(makeThunk({event, relays}))
  const {status, message} = statusData[url]

  if (message.includes("already a member")) return [true, ""]
  if (status !== PublishStatus.Success) return [false, message]
  if (await load({filters, relays})) return [true, ""]

  return [
    false,
    "Your request was not automatically approved, but may be approved manually later. Please try again later or contact the group admin.",
  ]
}
