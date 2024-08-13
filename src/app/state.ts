import type {Readable} from "svelte/store"
import {writable, readable, derived} from "svelte/store"
import {uniq, pushToMapKey, nthEq, batcher, postJson, stripProtocol, assoc, indexBy, now} from "@welshman/lib"
import {getIdentifier, normalizeRelayUrl, getPubkeyTagValues, GROUP_META, PROFILE, FOLLOWS, MUTES, GROUPS, getGroupTagValues} from "@welshman/util"
import type {Filter, SignedEvent, CustomEvent} from '@welshman/util'
import {subscribe} from '@welshman/net'
import {readProfile, readList, asDecryptedEvent} from '@welshman/domain'
import type {PublishedProfile, PublishedList} from '@welshman/domain'
import {decrypt} from '@welshman/signer'
import {deriveEvents, deriveEventsMapped, getter, withGetter} from "@welshman/store"
import {synced, parseJson} from '@lib/util'
import type {Session, Handle, Relay} from '@app/types'
import {INDEXER_RELAYS, DUFFLEPUD_URL, repository, pk, getSessions, makeSigner} from "@app/base"

// Utils

export const createCollection = <T>({
  store,
  getKey,
  isStale,
  loadItem,
}: {
  store: Readable<T[]>,
  getKey: (item: T) => string,
  isStale: (item: T) => boolean,
  loadItem: (key: string, ...args: any) => Promise<any>
}) => {
  const indexStore = derived(store, $items => indexBy(getKey, $items))
  const getIndex = getter(indexStore)

  const getItem = async (key: string, ...args: any[]) => {
    const item = getIndex().get(key)

    if (item && isStale(item)) {
      return item
    }

    await loadItem(key, ...args)

    return getIndex().get(key)
  }

  const deriveItem = (key: string | undefined, ...args: any[]) => {
    if (!key) {
      return readable(undefined)
    }

    // If we don't yet have the item, or it's stale, trigger a request for it. The derived
    // store will update when it arrives
    loadItem(key, ...args)

    return derived(indexStore, $index => $index.get(key))
  }

  return {indexStore, getIndex, deriveItem, loadItem, getItem}
}

export const load = ({relays, filters}: {relays: string[], filters: Filter[]}) =>
  new Promise<CustomEvent | undefined>(resolve => {
    const sub = subscribe({relays, filters, closeOnEose: true})

    sub.emitter.on('event', (url: string, event: SignedEvent) => {
      const e: CustomEvent = {...event, fetched_at: now()}

      repository.publish(e)
      resolve(e)
    })

    sub.emitter.on('close', () => resolve(undefined))
  })

// Plaintext

export const plaintext = withGetter(writable<Record<string, string>>({}))

export const getPlaintext = (e: CustomEvent) => plaintext.get()[e.id]

export const setPlaintext = (e: CustomEvent, content: string) =>
  plaintext.update(assoc(e.id, content))

export const ensurePlaintext = async (e: CustomEvent) => {
  if (!getPlaintext(e)) {
    const sessions = getSessions()
    const session = sessions[e.pubkey]
    const signer = makeSigner(session)

    if (signer) {
      setPlaintext(e, await decrypt(signer, e.pubkey, e.content))
    }
  }

  return getPlaintext(e)
}

// Relay info

export const relays = writable<Relay[]>([])

export const {
  indexStore: relaysByUrl,
  getIndex: getRelaysByUrl,
  deriveItem: deriveRelay,
  loadItem: loadRelay,
  getItem: getRelay,
} = createCollection({
    store: relays,
    getKey: (relay: Relay) => relay.url,
    isStale: (relay: Relay) => relay.fetched_at < now() - 3600,
    loadItem: batcher(800, async (urls: string[]) => {
      const urlSet = new Set(urls)
      const res = await postJson(`${DUFFLEPUD_URL}/relay/info`, {urls: Array.from(urlSet)})
      const items: Relay[] = (res?.data || []).map(({url, info}: any) => ({...info, url, fetched_at: now()}))

      relays.update($relays => [
        ...$relays.filter($relay => !urlSet.has($relay.url)),
        ...items,
      ])

      return items
    }),
})

// Handles

export const handles = writable<Handle[]>([])

export const {
  indexStore: handlesByPubkey,
  getIndex: getHandlesByPubkey,
  deriveItem: deriveHandle,
  loadItem: loadHandle,
  getItem: getHandle,
} = createCollection({
    store: handles,
    getKey: (handle: Handle) => handle.pubkey,
    isStale: (handle: Handle) => handle.fetched_at < now() - 3600,
    loadItem: batcher(800, async (nip05s: string[]) => {
      const nip05Set = new Set(nip05s)
      const res = await postJson(`${DUFFLEPUD_URL}/handle/info`, {handles: Array.from(nip05Set)})
      const items: Handle[] = (res?.data || []).map(({handle: nip05, info}: any) => ({...info, nip05, fetched_at: now()}))

      handles.update($handles => [
        ...$handles.filter($handle => !nip05Set.has($handle.nip05)),
        ...items,
      ])

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
  getItem: getProfile,
} = createCollection({
    store: profiles,
    getKey: profile => profile.event.pubkey,
    isStale: (profile: PublishedProfile) => profile.event.fetched_at < now() - 3600,
    loadItem: (pubkey: string, relays = []) =>
      load({
        relays: [...relays, ...INDEXER_RELAYS],
        filters: [{kinds: [PROFILE], authors: [pubkey]}],
      }),
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
  getItem: getFollows,
} = createCollection({
    store: follows,
    getKey: follows => follows.event.pubkey,
    isStale: (follows: PublishedList) => follows.event.fetched_at < now() - 3600,
    loadItem: (pubkey: string, relays = []) =>
      load({
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
  getItem: getMutes,
} = createCollection({
    store: mutes,
    getKey: mute => mute.event.pubkey,
    isStale: (mutes: PublishedList) => mutes.event.fetched_at < now() - 3600,
    loadItem: (pubkey: string, relays = []) =>
      load({
        relays: [...relays, ...INDEXER_RELAYS],
        filters: [{kinds: [MUTES], authors: [pubkey]}],
      })
})

// Groups

export const GROUP_DELIMITER = `'`

export const makeGroupId = (url: string, nom: string) =>
  [stripProtocol(url), nom].join(GROUP_DELIMITER)

export const splitGroupId = (groupId: string) => {
  const [url, nom] = groupId.split(GROUP_DELIMITER)

  return [normalizeRelayUrl(url), nom]
}

export const getGroupUrl = (groupId: string) => splitGroupId(groupId)[0]

export const getGroupNom = (groupId: string) => splitGroupId(groupId)[1]

export const getGroupName = (e?: CustomEvent) => e?.tags.find(nthEq(0, "name"))?.[1]

export const getGroupPicture = (e?: CustomEvent) => e?.tags.find(nthEq(0, "picture"))?.[1]

export type Group = {
  id: string,
  nom: string,
  url: string,
  name?: string,
  picture?: string,
  event?: CustomEvent
}

export type PublishedGroup = Omit<Group, "event"> & {
  event: CustomEvent
}

export const readGroup = (event: CustomEvent) => {
  const id = getIdentifier(event)!
  const [url, nom] = id.split(GROUP_DELIMITER)
  const name = event?.tags.find(nthEq(0, "name"))?.[1]
  const picture = event?.tags.find(nthEq(0, "picture"))?.[1]

  return {id, nom, url, name, picture, event}
}

export const groups = deriveEventsMapped<PublishedGroup>({
  repository,
  filters: [{kinds: [GROUP_META]}],
  eventToItem: readGroup,
  itemToEvent: item => item.event,
})

export const validGroups = derived([relaysByUrl, groups], ([$relaysByUrl, $groups]) =>
  $groups.filter(group => $relaysByUrl.get(group.url)?.pubkey === group.event.pubkey)
)

export const {
  indexStore: groupsById,
  getIndex: getGroupsById,
  deriveItem: deriveGroup,
  loadItem: loadGroup,
  getItem: getGroup,
} = createCollection({
    store: validGroups,
    getKey: (group: PublishedGroup) => group.id,
    isStale: (group: PublishedGroup) => group.event.fetched_at < now() - 3600,
    loadItem: (id: string) => {
      const url = getGroupUrl(id)

      return Promise.all([
        loadRelay(url),
        load({
          relays: [url],
          filters: [{kinds: [GROUP_META], '#d': [id]}],
        }),
      ])
    }
})

// Group membership

export type GroupMembership = {
  ids: Set<string>
  event?: CustomEvent
}

export type PublishedGroupMembership = Omit<GroupMembership, "event"> & {
  event: CustomEvent
}

export const readGroupMembership = (event: CustomEvent) =>
  ({event, ids: new Set(getGroupTagValues(event.tags))})

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
  getItem: getGroupMembership,
} = createCollection({
    store: groupMemberships,
    getKey: groupMembership => groupMembership.event.pubkey,
    isStale: (groupMembership: PublishedGroupMembership) => groupMembership.event.fetched_at < now() - 3600,
    loadItem: (pubkey: string, relays = []) =>
      load({
        relays: [...relays, ...INDEXER_RELAYS],
        filters: [{kinds: [GROUPS], authors: [pubkey]}],
      })
})
