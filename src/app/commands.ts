import {goto} from "$app/navigation"
import {append, uniqBy, now} from "@welshman/lib"
import {GROUPS, asDecryptedEvent, readList, editList, makeList, createList} from "@welshman/util"
import {pushToast} from "@app/toast"
import {pk, signer, repository, INDEXER_RELAYS} from "@app/base"
import {
  splitGroupId,
  loadRelay,
  loadGroup,
  getWriteRelayUrls,
  loadRelaySelections,
  publish,
  ensurePlaintext,
} from "@app/state"

export type ModifyTags = (tags: string[][]) => string[][]

export const updateList = async (kind: number, modifyTags: ModifyTags) => {
  const $pk = pk.get()!
  const $signer = signer.get()!
  const [prev] = repository.query([{kinds: [kind], authors: [$pk]}])

  // Preserve content instead of use encrypted tags because kind 3 content is used for
  // relay selections in many places. Content isn't supported for mutes or relays so this is ok
  const relays = [...INDEXER_RELAYS, ...getWriteRelayUrls(await loadRelaySelections($pk))]
  const encrypt = (content: string) => $signer.nip44.encrypt($pk, content)

  let encryptable
  if (prev) {
    const content = await ensurePlaintext(prev)
    const list = readList(asDecryptedEvent(prev, {content}))
    const publicTags = modifyTags(list.publicTags)

    encryptable = editList({...list, publicTags})
  } else {
    const list = makeList({kind})
    const publicTags = modifyTags(list.publicTags)

    encryptable = createList({...list, publicTags})
  }

  const template = await encryptable.reconcile(encrypt)
  const event = await $signer.sign({...template, created_at: now()})

  await publish({event, relays})
}

export const addGroupMemberships = (newTags: string[][]) =>
  updateList(GROUPS, (tags: string[][]) => uniqBy(t => t.join(""), [...tags, ...newTags]))

export const removeGroupMemberships = (noms: string[]) =>
  updateList(GROUPS, (tags: string[][]) => tags.filter(t => !noms.includes(t[1])))
