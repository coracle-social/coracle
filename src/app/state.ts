import {throttle} from "throttle-debounce"
import type {Readable} from "svelte/store"
import type {FuseResult} from "fuse.js"
import {get, writable, readable, derived} from "svelte/store"
import type {Maybe} from "@welshman/lib"
import {
  max,
  first,
  between,
  uniqBy,
  groupBy,
  pushToMapKey,
  nthEq,
  batcher,
  postJson,
  stripProtocol,
  assoc,
  indexBy,
  now,
  Worker,
  inc,
} from "@welshman/lib"
import {
  getIdFilters,
  getIdentifier,
  getRelayTags,
  normalizeRelayUrl,
  GROUP_META,
  PROFILE,
  RELAYS,
  FOLLOWS,
  MUTES,
  GROUPS,
  getGroupTags,
  readProfile,
  readList,
  asDecryptedEvent,
  displayProfile,
  displayPubkey,
  GROUP_JOIN,
  GROUP_ADD_USER,
} from "@welshman/util"
import type {
  SignedEvent,
  HashedEvent,
  EventTemplate,
  TrustedEvent,
  PublishedProfile,
  PublishedList,
} from "@welshman/util"
import type {SubscribeRequest} from "@welshman/net"
import {publish as basePublish, subscribe as baseSubscribe, PublishStatus} from "@welshman/net"
import {decrypt, stamp, own, hash} from "@welshman/signer"
import {custom, deriveEvents, deriveEventsMapped, getter, withGetter} from "@welshman/store"
import {createSearch} from "@lib/util"
import type {Handle, Relay} from "@app/types"
import {
  INDEXER_RELAYS,
  DUFFLEPUD_URL,
  repository,
  pk,
  getSession,
  getSigner,
  REACTION_KINDS,
} from "@app/base"

// Utils

export const createCollection = <T>({
  name,
  store,
  getKey,
  load,
}: {
  name: string
  store: Readable<T[]>
  getKey: (item: T) => string
  load: (key: string, ...args: any) => Promise<any>
}) => {
  const indexStore = derived(store, $items => indexBy(getKey, $items))
  const getIndex = getter(indexStore)
  const getItem = (key: string) => getIndex().get(key)
  const pending = new Map<string, Promise<Maybe<T>>>()

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

// Publish

export type Thunk = {
  event: HashedEvent
  relays: string[]
}

export type ThunkWithResolve = Thunk & {
  resolve: (data: PublishStatusDataByUrl) => void
}

export const thunkWorker = new Worker<ThunkWithResolve>()

thunkWorker.addGlobalHandler(async ({event, relays, resolve}: ThunkWithResolve) => {
  const session = getSession(event.pubkey)

  if (!session) {
    return console.warn(`No session found for ${event.pubkey}`)
  }

  const signedEvent = await getSigner(session)!.sign(event)
  const pub = basePublish({event: signedEvent, relays})

  // Copy the signature over since we had deferred it
  ;(repository.getEvent(signedEvent.id) as SignedEvent).sig = signedEvent.sig

  // Track publish success
  const {id} = event
  const statusByUrl: PublishStatusDataByUrl = {}

  pub.emitter.on("*", (status: PublishStatus, url: string, message: string) => {
    publishStatusData.update(
      assoc(id, Object.assign(statusByUrl, {[url]: {id, url, status, message}})),
    )

    if (
      Object.values(statusByUrl).filter(s => s.status !== PublishStatus.Pending).length ===
      relays.length
    ) {
      resolve(statusByUrl)
    }
  })
})

export type ThunkParams = {
  event: EventTemplate
  relays: string[]
}

export const makeThunk = ({event, relays}: ThunkParams) => {
  const $pk = get(pk)

  if (!$pk) {
    throw new Error("Unable to make thunk if no user is logged in")
  }

  return {event: hash(own(stamp(event), $pk)), relays}
}

export const publishThunk = (thunk: Thunk) =>
  new Promise<PublishStatusDataByUrl>(resolve => {
    thunkWorker.push({...thunk, resolve})
    repository.publish(thunk.event)
  })

// Subscribe

export const subscribe = (request: SubscribeRequest) => {
  const sub = baseSubscribe({delay: 50, authTimeout: 3000, ...request})

  sub.emitter.on("event", (url: string, e: SignedEvent) => {
    repository.publish(e)
  })

  return sub
}

export const load = (request: SubscribeRequest) =>
  new Promise<TrustedEvent[]>(resolve => {
    const sub = subscribe({closeOnEose: true, timeout: 3000, ...request})
    const events: TrustedEvent[] = []

    sub.emitter.on("event", (url: string, e: SignedEvent) => events.push(e))
    sub.emitter.on("complete", () => resolve(events))
  })

export const loadOne = async (request: SubscribeRequest) => first(await load(request))

// Publish status

export type PublishStatusData = {
  id: string
  url: string
  message: string
  status: PublishStatus
}

export type PublishStatusDataByUrl = Record<string, PublishStatusData>

export type PublishStatusDataByUrlById = Record<string, PublishStatusDataByUrl>

export const publishStatusData = writable<PublishStatusDataByUrlById>({})

// Freshness

export const freshness = withGetter(writable<Record<string, number>>({}))

export const getFreshnessKey = (ns: string, key: string) => `${ns}:${key}`

export const getFreshness = (ns: string, key: string) =>
  freshness.get()[getFreshnessKey(ns, key)] || 0

export const setFreshness = (ns: string, key: string, ts: number) =>
  freshness.update(assoc(getFreshnessKey(ns, key), ts))

export const setFreshnessBulk = (ns: string, updates: Record<string, number>) =>
  freshness.update($freshness => {
    for (const [key, ts] of Object.entries(updates)) {
      $freshness[key] = ts
    }

    return $freshness
  })

// Plaintext

export const plaintext = withGetter(writable<Record<string, string>>({}))

export const getPlaintext = (e: TrustedEvent) => plaintext.get()[e.id]

export const setPlaintext = (e: TrustedEvent, content: string) =>
  plaintext.update(assoc(e.id, content))

export const ensurePlaintext = async (e: TrustedEvent) => {
  if (e.content && !getPlaintext(e)) {
    const $signer = getSigner(getSession(e.pubkey))

    if ($signer) {
      setPlaintext(e, await decrypt($signer, e.pubkey, e.content))
    }
  }

  return getPlaintext(e)
}

// Topics

export type Topic = {
  name: string
  count: number
}

export const topics = custom<Topic[]>(setter => {
  const getTopics = () => {
    const topics = new Map<string, number>()
    for (const tagString of repository.eventsByTag.keys()) {
      if (tagString.startsWith("t:")) {
        const topic = tagString.slice(2).toLowerCase()

        topics.set(topic, inc(topics.get(topic)))
      }
    }

    return Array.from(topics.entries()).map(([name, count]) => ({name, count}))
  }

  setter(getTopics())

  const onUpdate = throttle(3000, () => setter(getTopics()))

  repository.on("update", onUpdate)

  return () => repository.off("update", onUpdate)
})

export const searchTopics = derived(topics, $topics =>
  createSearch($topics, {
    getValue: (topic: Topic) => topic.name,
    fuseOptions: {keys: ["name"]},
  }),
)

// Relay info

export const relays = writable<Relay[]>([])

export const relaysByPubkey = derived(relays, $relays =>
  groupBy(
    ($relay: Relay) => $relay.pubkey,
    $relays.filter(r => r.pubkey),
  ),
)

export const {
  indexStore: relaysByUrl,
  getIndex: getRelaysByUrl,
  deriveItem: deriveRelay,
  loadItem: loadRelay,
} = createCollection({
  name: "relays",
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

export const searchRelays = derived(relays, $relays =>
  createSearch($relays, {
    getValue: (relay: Relay) => relay.url,
    fuseOptions: {
      keys: ["url", "name", {name: "description", weight: 0.3}],
    },
  }),
)

// Handles

export const handles = writable<Handle[]>([])

export const {
  indexStore: handlesByNip05,
  getIndex: getHandlesByNip05,
  deriveItem: deriveHandle,
  loadItem: loadHandle,
} = createCollection({
  name: "handles",
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

export const profiles = deriveEventsMapped<PublishedProfile>(repository, {
  filters: [{kinds: [PROFILE]}],
  eventToItem: readProfile,
  itemToEvent: item => item.event,
})

export const {
  indexStore: profilesByPubkey,
  getIndex: getProfilesByPubkey,
  deriveItem: deriveProfile,
  loadItem: loadProfile,
} = createCollection({
  name: "profiles",
  store: profiles,
  getKey: profile => profile.event.pubkey,
  load: async (pubkey: string, hints = [], request: Partial<SubscribeRequest> = {}) => {
    const relays = getWriteRelayUrls(await loadRelaySelections(pubkey))

    return load({
      ...request,
      relays: [...relays, ...hints, ...INDEXER_RELAYS],
      filters: [{kinds: [PROFILE], authors: [pubkey]}],
    })
  },
})

export const searchProfiles = derived(profiles, $profiles =>
  createSearch($profiles, {
    getValue: (profile: PublishedProfile) => profile.event.pubkey,
    fuseOptions: {
      keys: ["name", "display_name", {name: "about", weight: 0.3}],
    },
  }),
)

export const displayProfileByPubkey = (pubkey: string, profile?: PublishedProfile) =>
  displayProfile(profile, pubkey ? displayPubkey(pubkey) : undefined)

export const deriveProfileDisplay = (pubkey: string) =>
  derived(deriveProfile(pubkey), $profile => displayProfileByPubkey(pubkey, $profile))

// Relay selections

export const getReadRelayUrls = (event?: TrustedEvent): string[] =>
  getRelayTags(event?.tags || [])
    .filter((t: string[]) => !t[2] || t[2] === "read")
    .map((t: string[]) => normalizeRelayUrl(t[1]))

export const getWriteRelayUrls = (event?: TrustedEvent): string[] =>
  getRelayTags(event?.tags || [])
    .filter((t: string[]) => !t[2] || t[2] === "write")
    .map((t: string[]) => normalizeRelayUrl(t[1]))

export const relaySelections = deriveEvents(repository, {filters: [{kinds: [RELAYS]}]})

export const {
  indexStore: relaySelectionsByPubkey,
  getIndex: getRelaySelectionsByPubkey,
  deriveItem: deriveRelaySelections,
  loadItem: loadRelaySelections,
} = createCollection({
  name: "relaySelections",
  store: relaySelections,
  getKey: relaySelections => relaySelections.pubkey,
  load: (pubkey: string, hints = [], request: Partial<SubscribeRequest> = {}) =>
    load({
      ...request,
      relays: [...hints, ...INDEXER_RELAYS],
      filters: [{kinds: [RELAYS], authors: [pubkey]}],
    }),
})

// Follows

export const follows = deriveEventsMapped<PublishedList>(repository, {
  filters: [{kinds: [FOLLOWS]}],
  itemToEvent: item => item.event,
  eventToItem: async (event: TrustedEvent) =>
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
} = createCollection({
  name: "follows",
  store: follows,
  getKey: follows => follows.event.pubkey,
  load: async (pubkey: string, hints = [], request: Partial<SubscribeRequest> = {}) => {
    const relays = getWriteRelayUrls(await loadRelaySelections(pubkey, hints))

    return load({
      ...request,
      relays: [...relays, ...hints, ...INDEXER_RELAYS],
      filters: [{kinds: [FOLLOWS], authors: [pubkey]}],
    })
  },
})

// Mutes

export const mutes = deriveEventsMapped<PublishedList>(repository, {
  filters: [{kinds: [MUTES]}],
  itemToEvent: item => item.event,
  eventToItem: async (event: TrustedEvent) =>
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
} = createCollection({
  name: "mutes",
  store: mutes,
  getKey: mute => mute.event.pubkey,
  load: async (pubkey: string, hints = [], request: Partial<SubscribeRequest> = {}) => {
    const relays = getWriteRelayUrls(await loadRelaySelections(pubkey, hints))

    return load({
      ...request,
      relays: [...relays, ...hints, ...INDEXER_RELAYS],
      filters: [{kinds: [MUTES], authors: [pubkey]}],
    })
  },
})

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
  getIndex: getGroupsByNom,
  deriveItem: deriveGroup,
  loadItem: loadGroup,
} = createCollection({
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
  getIndex: getGroupMembershipsByPubkey,
  deriveItem: deriveGroupMembership,
  loadItem: loadGroupMembership,
} = createCollection({
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
  getIndex: getGroupChatsByNom,
  deriveItem: deriveGroupChat,
  loadItem: loadGroupChat,
} = createCollection({
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

export const userProfile = derived([pk, profilesByPubkey], ([$pk, $profilesByPubkey]) => {
  if (!$pk) return null

  loadProfile($pk)

  return $profilesByPubkey.get($pk)
})

export const userMembership = derived(
  [pk, groupMembershipByPubkey],
  ([$pk, $groupMembershipByPubkey]) => {
    if (!$pk) return null

    loadGroupMembership($pk)

    return $groupMembershipByPubkey.get($pk)
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
