import {writable, derived} from "svelte/store"
import {pushToMapKey, indexBy} from "@welshman/lib"
import {getIdentifier, getPubkeyTagValues, GROUP_META, PROFILE, FOLLOWS, MUTES, GROUPS, getGroupTagValues} from "@welshman/util"
import {deriveEvents} from "@welshman/store"
import {synced, parseJson} from '@lib/util'
import type {Session} from '@app/types'
import {repository, pk} from "@app/base"
import {getGroupNom, getGroupUrl, getGroupName, getGroupPicture, GROUP_DELIMITER} from "@app/domain"

export const relayInfo = writable(new Map())

export const handleInfo = writable(new Map())

export const profileEvents = deriveEvents(repository, {
  filters: [{kinds: [PROFILE]}],
})

export const profiles = derived(profileEvents, $profileEvents =>
  $profileEvents.map(event => ({...parseJson(event.content), event}))
)

export const profilesByPubkey = derived(profiles, $profiles => indexBy(profile => profile.event.pubkey, $profiles))

export const deriveProfile = (pubkey: string) => derived(profilesByPubkey, $m => $m.get(pubkey))

export const followEvents = deriveEvents(repository, {
  filters: [{kinds: [FOLLOWS]}],
})

export const follows = derived(followEvents, $followEvents =>
  $followEvents.map(event => ({pubkeys: new Set(getPubkeyTagValues(event.tags)), event}))
)

export const followsByPubkey = derived(follows, $follows => indexBy(follow => follow.event.pubkey, $follows))

export const muteEvents = deriveEvents(repository, {
  filters: [{kinds: [MUTES]}],
})

export const mutes = derived(muteEvents, $muteEvents =>
  $muteEvents.map(event => ({pubkeys: new Set(getPubkeyTagValues(event.tags)), event}))
)

export const mutesByPubkey = derived(mutes, $mutes => indexBy(mute => mute.event.pubkey, $mutes))

export const groupEvents = deriveEvents(repository, {
  filters: [{kinds: [GROUP_META]}],
})

export const groups = derived([relayInfo, groupEvents], ([$relayInfo, $groupEvents]) =>
  $groupEvents
    .map(event => ({
      event,
      id: getIdentifier(event),
      nom: getGroupNom(event),
      url: getGroupUrl(event),
      name: getGroupName(event),
      picture: getGroupPicture(event),
    }))
    .filter(group => $relayInfo.get(group.url)?.pubkey === group.event.pubkey)
)

export const groupsById = derived(groups, $groups => indexBy(group => group.id, $groups))

export const groupsEvents = deriveEvents(repository, {
  filters: [{kinds: [GROUPS]}],
})

export const userGroupsEvent = derived([pk, groupsEvents], ([$pk, $groupsEvents]) =>
  $groupsEvents.find(e => e.pubkey === $pk),
)

export const userGroupRelaysByNom = derived(userGroupsEvent, $userGroupsEvent => {
  const relaysByNom = new Map()

  for (const id of getGroupTagValues($userGroupsEvent?.tags || [])) {
    const [relay, nom] = id.split(GROUP_DELIMITER)

    pushToMapKey(relaysByNom, nom, relay)
  }

  return relaysByNom
})
