import type {FuseResult} from "fuse.js"
import {get, derived} from "svelte/store"
import type {Maybe} from "@welshman/lib"
import {max, between, groupBy, pushToMapKey, nthEq, stripProtocol, indexBy} from "@welshman/lib"
import {
  getIdFilters,
  getIdentifier,
  normalizeRelayUrl,
  GROUP_META,
  GROUPS,
  getGroupTags,
  GROUP_JOIN,
  GROUP_ADD_USER,
  REACTION,
  ZAP_RESPONSE,
} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {
  env,
  pubkey,
  repository,
  createSearch,
  load,
  collection,
  loadRelay,
  relaysByPubkey,
  loadProfile,
  profilesByPubkey,
  loadRelaySelections,
  getWriteRelayUrls,
} from "@welshman/app"
import type {Relay} from "@welshman/app"
import type {SubscribeRequest} from "@welshman/net"
import {deriveEvents, deriveEventsMapped, withGetter} from "@welshman/store"

export const DEFAULT_RELAYS = [
  "wss://groups.fiatjaf.com/",
  "wss://relay29.galaxoidlabs.com/",
  "wss://devrelay.highlighter.com/",
  "wss://relay.groups.nip29.com/",
]

export const INDEXER_RELAYS = ["wss://purplepag.es/", "wss://relay.damus.io/", "wss://nos.lol/"]

export const DUFFLEPUD_URL = "https://dufflepud.onrender.com"

export const REACTION_KINDS = [REACTION, ZAP_RESPONSE]

Object.assign(env, {DUFFLEPUD_URL})

export const deriveEvent = (idOrAddress: string, hints: string[] = []) => {
  let attempted = false

  const filters = getIdFilters([idOrAddress])
  const relays = [...hints, ...INDEXER_RELAYS]

  return derived(
    deriveEvents(repository, {filters, includeDeleted: true}),
    (events: TrustedEvent[]) => {
      if (!attempted && events.length === 0) {
        load({relays, filters})
        attempted = true
      }

      return events[0]
    },
  )
}

// Groups

export const GROUP_DELIMITER = `'`

export const makeGroupId = (url: string, nom: string) =>
  [stripProtocol(url).replace(/\/$/, ""), nom].join(GROUP_DELIMITER)

export const splitGroupId = (groupId: string) => {
  const [url, nom] = groupId.split(GROUP_DELIMITER)

  return [normalizeRelayUrl(url), nom]
}

export const getGroupUrl = (groupId: string) => splitGroupId(groupId)[0]

export const getGroupNom = (groupId: string) => splitGroupId(groupId)[1]

export const getGroupName = (e?: TrustedEvent) => e?.tags.find(nthEq(0, "name"))?.[1]

export const getGroupPicture = (e?: TrustedEvent) => e?.tags.find(nthEq(0, "picture"))?.[1]

export const displayGroup = (group?: Group) => group?.name || group?.nom || "[no name]"

export type Group = {
  nom: string
  name?: string
  about?: string
  picture?: string
  event?: TrustedEvent
}

export type PublishedGroup = Omit<Group, "event"> & {
  event: TrustedEvent
}

export const readGroup = (event: TrustedEvent) => {
  const nom = getIdentifier(event)!
  const name = event?.tags.find(nthEq(0, "name"))?.[1]
  const about = event?.tags.find(nthEq(0, "about"))?.[1]
  const picture = event?.tags.find(nthEq(0, "picture"))?.[1]

  return {nom, name, about, picture, event}
}

export const groups = deriveEventsMapped<PublishedGroup>(repository, {
  filters: [{kinds: [GROUP_META]}],
  eventToItem: readGroup,
  itemToEvent: item => item.event,
})

export const {
  indexStore: groupsByNom,
  deriveItem: deriveGroup,
  loadItem: loadGroup,
} = collection({
  name: "groups",
  store: groups,
  getKey: (group: PublishedGroup) => group.nom,
  load: async (nom: string, hints: string[] = [], request: Partial<SubscribeRequest> = {}) => {
    if (hints.length === 0) {
      hints = relayUrlsByNom.get().get(nom) || []
    }

    await Promise.all([
      ...hints.map(loadRelay),
      load({
        ...request,
        relays: hints,
        filters: [{kinds: [GROUP_META], "#d": [nom]}],
      }),
    ])
  },
})

export const searchGroups = derived(groups, $groups =>
  createSearch($groups, {
    getValue: (group: PublishedGroup) => group.nom,
    sortFn: (result: FuseResult<PublishedGroup>) => {
      const scale = result.item.picture ? 0.5 : 1

      return result.score! * scale
    },
    fuseOptions: {
      keys: ["name", {name: "about", weight: 0.3}],
    },
  }),
)

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
  }),
)

export const qualifiedGroupsById = derived(qualifiedGroups, $qualifiedGroups =>
  indexBy($qg => $qg.id, $qualifiedGroups),
)

export const qualifiedGroupsByNom = derived(qualifiedGroups, $qualifiedGroups =>
  groupBy($qg => $qg.group.nom, $qualifiedGroups),
)

export const relayUrlsByNom = withGetter(
  derived(qualifiedGroups, $qualifiedGroups => {
    const $relayUrlsByNom = new Map()

    for (const {relay, group} of $qualifiedGroups) {
      pushToMapKey($relayUrlsByNom, group.nom, relay.url)
    }

    return $relayUrlsByNom
  }),
)

// Group membership

export type GroupMembership = {
  ids: Set<string>
  noms: Set<string>
  urls: Set<string>
  event?: TrustedEvent
}

export type PublishedGroupMembership = Omit<GroupMembership, "event"> & {
  event: TrustedEvent
}

export const readGroupMembership = (event: TrustedEvent) => {
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

export const groupMemberships = deriveEventsMapped<PublishedGroupMembership>(repository, {
  filters: [{kinds: [GROUPS]}],
  eventToItem: readGroupMembership,
  itemToEvent: item => item.event,
})

export const {
  indexStore: groupMembershipByPubkey,
  deriveItem: deriveGroupMembership,
  loadItem: loadGroupMembership,
} = collection({
  name: "groupMemberships",
  store: groupMemberships,
  getKey: groupMembership => groupMembership.event.pubkey,
  load: async (pubkey: string, hints = [], request: Partial<SubscribeRequest> = {}) => {
    const relays = getWriteRelayUrls(await loadRelaySelections(pubkey, hints))

    return load({
      ...request,
      relays: [...hints, ...relays, ...INDEXER_RELAYS],
      filters: [{kinds: [GROUPS], authors: [pubkey]}],
    })
  },
})

// Group Messages

export type GroupMessage = {
  nom: string
  event: TrustedEvent
}

export const readGroupMessage = (event: TrustedEvent): Maybe<GroupMessage> => {
  const nom = event.tags.find(nthEq(0, "h"))?.[1]

  if (
    !nom ||
    between(GROUP_ADD_USER - 1, GROUP_JOIN + 1, event.kind) ||
    REACTION_KINDS.includes(event.kind)
  ) {
    return undefined
  }

  return {nom, event}
}

export const groupMessages = deriveEventsMapped<GroupMessage>(repository, {
  filters: [{}],
  eventToItem: readGroupMessage,
  itemToEvent: item => item.event,
})

// Group Chats

export type GroupChat = {
  nom: string
  messages: GroupMessage[]
}

export const groupChats = derived(groupMessages, $groupMessages => {
  const groupMessagesByNom = groupBy($groupMessage => $groupMessage.nom, $groupMessages)

  return Array.from(groupMessagesByNom.entries()).map(([nom, messages]) => ({nom, messages}))
})

export const {
  indexStore: groupChatByNom,
  deriveItem: deriveGroupChat,
  loadItem: loadGroupChat,
} = collection({
  name: "groupChats",
  store: groupChats,
  getKey: groupChat => groupChat.nom,
  load: (nom: string, hints = [], request: Partial<SubscribeRequest> = {}) => {
    const relays = [...hints, ...(get(relayUrlsByNom).get(nom) || [])]
    const chat = get(groupChats).find(c => c.nom === nom)
    const timestamps = chat?.messages.map(m => m.event.created_at) || []
    const since = Math.max(0, max(timestamps) - 3600)

    return load({...request, relays, filters: [{"#h": [nom], since}]})
  },
})

// User stuff

export const userProfile = derived([pubkey, profilesByPubkey], ([$pubkey, $profilesByPubkey]) => {
  if (!$pubkey) return null

  loadProfile($pubkey)

  return $profilesByPubkey.get($pubkey)
})

export const userMembership = derived(
  [pubkey, groupMembershipByPubkey],
  ([$pubkey, $groupMembershipByPubkey]) => {
    if (!$pubkey) return null

    loadGroupMembership($pubkey)

    return $groupMembershipByPubkey.get($pubkey)
  },
)

export const userGroupsByNom = withGetter(
  derived([userMembership, qualifiedGroupsById], ([$userMembership, $qualifiedGroupsById]) => {
    const $userGroupsByNom = new Map()

    for (const id of $userMembership?.ids || []) {
      const [url, nom] = splitGroupId(id)
      const group = $qualifiedGroupsById.get(id)
      const groups = $userGroupsByNom.get(nom) || []

      loadGroup(nom, [url])

      if (group) {
        groups.push(group)
      }

      $userGroupsByNom.set(nom, groups)
    }

    return $userGroupsByNom
  }),
)

export const userRelayUrlsByNom = derived(userGroupsByNom, $userGroupsByNom => {
  const $userRelayUrlsByNom = new Map()

  for (const [nom, groups] of $userGroupsByNom.entries()) {
    for (const group of groups) {
      pushToMapKey($userRelayUrlsByNom, nom, group.relay.url)
    }
  }

  return $userRelayUrlsByNom
})
