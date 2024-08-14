import type {Readable} from "svelte/store"
import {writable, readable, derived} from "svelte/store"
import type {Maybe} from "@welshman/lib"
import {uniq, uniqBy, groupBy, pushToMapKey, nthEq, batcher, postJson, stripProtocol, assoc, indexBy, now} from "@welshman/lib"
import {getIdentifier, getRelayTags, getRelayTagValues, normalizeRelayUrl, getPubkeyTagValues, GROUP_META, PROFILE, RELAYS, FOLLOWS, MUTES, GROUPS, getGroupTags, readProfile, readList, asDecryptedEvent, editList, makeList, createList} from "@welshman/util"
import type {Filter, SignedEvent, CustomEvent, PublishedProfile, PublishedList} from '@welshman/util'
import type {SubscribeRequest} from '@welshman/net'
import {publish, subscribe} from '@welshman/net'
import {decrypt} from '@welshman/signer'
import {deriveEvents, deriveEventsMapped, getter, withGetter} from "@welshman/store"
import {parseJson} from '@lib/util'
import type {Session, Handle, Relay} from '@app/types'
import {INDEXER_RELAYS, DUFFLEPUD_URL, repository, pk, getSession, getSigner, signer} from "@app/base"

// Utils

export const createCollection = <T>({
  name,
  store,
  getKey,
  load,
}: {
  name: string,
  store: Readable<T[]>,
  getKey: (item: T) => string,
  load: (key: string, ...args: any) => Promise<any>
}) => {
  const indexStore = derived(store, $items => indexBy(getKey, $items))
  const getIndex = getter(indexStore)
  const getItem = (key: string) => getIndex().get(key)
  const pending = new Map<string, Promise<Maybe<T>>>

  const loadItem = async (key: string, ...args: any[]) => {
    if (getFreshness(name, key) > now() - 3600) {
      return getIndex().get(key)
    }

    if (pending.has(key)) {
      await pending.get(key)
    } else {
      setFreshness(name, key, now())

      const promise = load(key, ...args)

      pending.set(key, promise)

      await promise

      pending.delete(key)
    }

    return getIndex().get(key)
  }

  const deriveItem = (key: Maybe<string>, ...args: any[]) => {
    if (!key) {
      return readable(undefined)
    }

    // If we don't yet have the item, or it's stale, trigger a request for it. The derived
    // store will update when it arrives
    load(key, ...args)

    return derived(indexStore, $index => $index.get(key))
  }

  return {indexStore, getIndex, deriveItem, loadItem, getItem}
}

export const load = (request: SubscribeRequest) =>
  new Promise<Maybe<CustomEvent>>(resolve => {
    const sub = subscribe({closeOnEose: true, timeout: 3000, delay: 50, ...request})

    sub.emitter.on('event', (url: string, e: SignedEvent) => {
      repository.publish(e)
      sub.close()
      resolve(e)
    })

    sub.emitter.on('complete', () => resolve(undefined))
  })

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

// Freshness

export const freshness = withGetter(writable<Record<string, number>>({}))

export const getFreshnessKey = (ns: string, key: string) => `${ns}:${key}`

export const getFreshness = (ns: string, key: string) => freshness.get()[getFreshnessKey(ns, key)] || 0

export const setFreshness = (ns: string, key: string, ts: number) => freshness.update(assoc(getFreshnessKey(ns, key), ts))

export const setFreshnessBulk = (ns: string, updates: Record<string, number>) =>
  freshness.update($freshness => {
    for (const [key, ts] of Object.entries(updates)) {
      $freshness[key] = ts
    }

    return $freshness
  })

// Plaintext

export const plaintext = withGetter(writable<Record<string, string>>({}))

export const getPlaintext = (e: CustomEvent) => plaintext.get()[e.id]

export const setPlaintext = (e: CustomEvent, content: string) =>
  plaintext.update(assoc(e.id, content))

export const ensurePlaintext = async (e: CustomEvent) => {
  if (e.content && !getPlaintext(e)) {
    const $signer = getSigner(getSession(e.pubkey))

    if ($signer) {
      setPlaintext(e, await decrypt($signer, e.pubkey, e.content))
    }
  }

  return getPlaintext(e)
}

// Relay info

export const relays = writable<Relay[]>([])

export const relaysByPubkey = derived(relays, $relays => groupBy(($relay: Relay) => $relay.pubkey, $relays))

export const {
  indexStore: relaysByUrl,
  getIndex: getRelaysByUrl,
  deriveItem: deriveRelay,
  loadItem: loadRelay,
  // getItem: getRelay,
} = createCollection({
  name: 'relays',
  store: relays,
  getKey: (relay: Relay) => relay.url,
  load: batcher(800, async (urls: string[]) => {
    const urlSet = new Set(urls)
    const res = await postJson(`${DUFFLEPUD_URL}/relay/info`, {urls: Array.from(urlSet)})
    const index = indexBy((item: any) => item.url, res?.data || [])
    const items: Relay[] = urls.map(url => {
      const {info = {}} = index.get(url) || {}

      return {...info, url}
    })

    relays.update($relays => uniqBy($relay => $relay.url, [...$relays, ...items]))

    return items
  }),
})

// Handles

export const handles = writable<Handle[]>([])

export const {
  indexStore: handlesByNip05,
  getIndex: getHandlesByNip05,
  deriveItem: deriveHandle,
  loadItem: loadHandle,
  // getItem: getHandle,
} = createCollection({
  name: 'handles',
  store: handles,
  getKey: (handle: Handle) => handle.nip05,
  load: batcher(800, async (nip05s: string[]) => {
    const nip05Set = new Set(nip05s)
    const res = await postJson(`${DUFFLEPUD_URL}/handle/info`, {handles: Array.from(nip05Set)})
    const index = indexBy((item: any) => item.handle, res?.data || [])
    const items: Handle[] = nip05s.map(nip05 => {
      const {info = {}} = index.get(nip05) || {}

      return {...info, nip05}
    })

    handles.update($handles => uniqBy($handle => $handle.nip05, [...$handles, ...items]))

    return items
  }),
})

// Profiles

export const profiles = deriveEventsMapped<PublishedProfile>({
  repository,
  filters: [{kinds: [PROFILE]}],
  eventToItem: readProfile,
  itemToEvent: item => item.event,
})

export const {
  indexStore: profilesByPubkey,
  getIndex: getProfilesByPubkey,
  deriveItem: deriveProfile,
  loadItem: loadProfile,
  // getItem: getProfile,
} = createCollection({
  name: 'profiles',
  store: profiles,
  getKey: profile => profile.event.pubkey,
  load: (pubkey: string, relays = [], request: Partial<SubscribeRequest> = {}) =>
    load({
      ...request,
      relays: [...relays, ...INDEXER_RELAYS],
      filters: [{kinds: [PROFILE], authors: [pubkey]}],
    }),
})

// Relay selections

export const getReadRelayUrls = (event?: CustomEvent): string[] =>
  getRelayTags(event?.tags || []).filter((t: string[]) => !t[2] || t[2] === 'read').map((t: string[]) => normalizeRelayUrl(t[1]))

export const getWriteRelayUrls = (event?: CustomEvent): string[] =>
  getRelayTags(event?.tags || []).filter((t: string[]) => !t[2] || t[2] === 'write').map((t: string[]) => normalizeRelayUrl(t[1]))

export const relaySelections = deriveEvents({repository, filters: [{kinds: [RELAYS]}]})

export const {
  indexStore: relaySelectionsByPubkey,
  getIndex: getRelaySelectionsByPubkey,
  deriveItem: deriveRelaySelections,
  loadItem: loadRelaySelections,
  // getItem: getRelaySelections,
} = createCollection({
  name: 'relaySelections',
  store: relaySelections,
  getKey: relaySelections => relaySelections.pubkey,
  load: (pubkey: string, relays = [], request: Partial<SubscribeRequest> = {}) =>
    load({
      ...request,
      relays: [...relays, ...INDEXER_RELAYS],
      filters: [{kinds: [RELAYS], authors: [pubkey]}],
    })
})

// Follows

export const follows = deriveEventsMapped<PublishedList>({
  repository,
  filters: [{kinds: [FOLLOWS]}],
  itemToEvent: item => item.event,
  eventToItem: async (event: CustomEvent) =>
    readList(
      asDecryptedEvent(event, {
        content: await ensurePlaintext(event),
      }),
    ),
})

export const {
  indexStore: followsByPubkey,
  getIndex: getFollowsByPubkey,
  deriveItem: deriveFollows,
  loadItem: loadFollows,
  // getItem: getFollows,
} = createCollection({
  name: 'follows',
  store: follows,
  getKey: follows => follows.event.pubkey,
  load: (pubkey: string, relays = [], request: Partial<SubscribeRequest> = {}) =>
    load({
      ...request,
      relays: [...relays, ...INDEXER_RELAYS],
      filters: [{kinds: [FOLLOWS], authors: [pubkey]}],
    })
})

// Mutes

export const mutes = deriveEventsMapped<PublishedList>({
  repository,
  filters: [{kinds: [MUTES]}],
  itemToEvent: item => item.event,
  eventToItem: async (event: CustomEvent) =>
    readList(
      asDecryptedEvent(event, {
        content: await ensurePlaintext(event),
      }),
    ),
})

export const {
  indexStore: mutesByPubkey,
  getIndex: getMutesByPubkey,
  deriveItem: deriveMutes,
  loadItem: loadMutes,
  // getItem: getMutes,
} = createCollection({
  name: 'mutes',
  store: mutes,
  getKey: mute => mute.event.pubkey,
  load: (pubkey: string, relays = [], request: Partial<SubscribeRequest> = {}) =>
    load({
      ...request,
      relays: [...relays, ...INDEXER_RELAYS],
      filters: [{kinds: [MUTES], authors: [pubkey]}],
    })
})

// Groups

export const GROUP_DELIMITER = `'`

export const makeGroupId = (url: string, nom: string) =>
  [stripProtocol(url).replace(/\/$/, ''), nom].join(GROUP_DELIMITER)

export const splitGroupId = (groupId: string) => {
  const [url, nom] = groupId.split(GROUP_DELIMITER)

  return [normalizeRelayUrl(url), nom]
}

export const getGroupUrl = (groupId: string) => splitGroupId(groupId)[0]

export const getGroupNom = (groupId: string) => splitGroupId(groupId)[1]

export const getGroupName = (e?: CustomEvent) => e?.tags.find(nthEq(0, "name"))?.[1]

export const getGroupPicture = (e?: CustomEvent) => e?.tags.find(nthEq(0, "picture"))?.[1]

export type Group = {
  nom: string,
  name?: string,
  picture?: string,
  event?: CustomEvent
}

export type PublishedGroup = Omit<Group, "event"> & {
  event: CustomEvent
}

export const readGroup = (event: CustomEvent) => {
  const nom = getIdentifier(event)!
  const name = event?.tags.find(nthEq(0, "name"))?.[1]
  const picture = event?.tags.find(nthEq(0, "picture"))?.[1]

  return {nom, name, picture, event}
}

export const groups = deriveEventsMapped<PublishedGroup>({
  repository,
  filters: [{kinds: [GROUP_META]}],
  eventToItem: readGroup,
  itemToEvent: item => item.event,
})

export const {
  indexStore: groupsByNom,
  getIndex: getGroupsByNom,
  deriveItem: deriveGroup,
  loadItem: loadGroup,
  // getItem: getGroup,
} = createCollection({
  name: 'groups',
  store: groups,
  getKey: (group: PublishedGroup) => group.nom,
  load: (nom: string, relays: string[] = [], request: Partial<SubscribeRequest> = {}) =>
    Promise.all([
      ...relays.map(loadRelay),
      load({
        ...request,
        relays,
        filters: [{kinds: [GROUP_META], '#d': [nom]}],
      }),
    ])
})

// Qualified groups

export type QualifiedGroup = {
  id: string
  relay: Relay
  group: PublishedGroup
}

export const qualifiedGroups = derived([relaysByPubkey, groups], ([$relaysByPubkey, $groups]) =>
  $groups.flatMap((group: PublishedGroup) => {
    const relays = $relaysByPubkey.get(group.event.pubkey) || []

    return relays.map(relay => ({id: makeGroupId(relay.url, group.nom), relay, group}))
  })
)

export const qualifiedGroupsById = derived(qualifiedGroups, $qualifiedGroups => indexBy($qg => $qg.id, $qualifiedGroups))

// Group membership

export type GroupMembership = {
  ids: Set<string>
  noms: Set<string>
  urls: Set<string>
  event?: CustomEvent
}

export type PublishedGroupMembership = Omit<GroupMembership, "event"> & {
  event: CustomEvent
}

export const readGroupMembership = (event: CustomEvent) => {
  const ids = new Set<string>()
  const noms = new Set<string>()
  const urls = new Set<string>()

  for (const [_, nom, url] of getGroupTags(event.tags)) {
    ids.add(makeGroupId(url, nom))
    noms.add(nom)
    urls.add(url)
  }

  return {event, ids, noms, urls}
}

export const groupMemberships = deriveEventsMapped<PublishedGroupMembership>({
  repository,
  filters: [{kinds: [GROUPS]}],
  eventToItem: readGroupMembership,
  itemToEvent: item => item.event,
})

export const {
  indexStore: groupMembershipsByPubkey,
  getIndex: getGroupMembersipsByPubkey,
  deriveItem: deriveGroupMembership,
  loadItem: loadGroupMembership,
  // getItem: getGroupMembership,
} = createCollection({
    name: 'groupMemberships',
    store: groupMemberships,
    getKey: groupMembership => groupMembership.event.pubkey,
    load: (pubkey: string, relays = [], request: Partial<SubscribeRequest> = {}) =>
      load({
        ...request,
        relays: [...relays, ...INDEXER_RELAYS],
        filters: [{kinds: [GROUPS], authors: [pubkey]}],
      })
})
