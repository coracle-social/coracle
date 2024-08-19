import {uniqBy, uniq, now} from "@welshman/lib"
import {
  GROUPS,
  asDecryptedEvent,
  getGroupTags,
  getRelayTagValues,
  readList,
  editList,
  makeList,
  createList,
  createEvent,
} from "@welshman/util"
import {pk, signer, repository, INDEXER_RELAYS} from "@app/base"
import {
  getWriteRelayUrls,
  loadGroup,
  loadGroupMembership,
  loadProfile,
  loadFollows,
  loadMutes,
  getRelaySelectionsByPubkey,
  loadRelaySelections,
  makeThunk,
  publishThunk,
  ensurePlaintext,
} from "@app/state"

export const loadUserData = async (pubkey: string, hints: string[] = []) => {
  const relaySelections = await loadRelaySelections(pubkey, INDEXER_RELAYS)
  const relays = uniq([
    ...getRelayTagValues(relaySelections?.tags || []),
    ...INDEXER_RELAYS,
    ...hints,
  ])
  const membership = await loadGroupMembership(pubkey, relays)
  const promises = [
    loadProfile(pubkey, relays),
    loadFollows(pubkey, relays),
    loadMutes(pubkey, relays),
  ]

  for (const [_, nom, url] of getGroupTags(membership?.event.tags || [])) {
    promises.push(loadGroup(nom, [url]))
  }

  await Promise.all(promises)
}

export type ModifyTags = (tags: string[][]) => string[][]

export const updateList = async (kind: number, modifyTags: ModifyTags) => {
  const $pk = pk.get()!
  const $signer = signer.get()!
  const [prev] = repository.query([{kinds: [kind], authors: [$pk]}])
  const relays = getWriteRelayUrls(getRelaySelectionsByPubkey().get($pk))

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
