import {writable, derived} from "svelte/store"
import {pushToMapKey, indexBy} from "@welshman/lib"
import {getIdentifier, GROUP_META, GROUPS, getGroupTagValues} from "@welshman/util"
import {deriveEvents} from "@welshman/store"
import {repository} from "@app/base"
import {getGroupUrl, GROUP_DELIMITER} from "@app/domain"

export const pk = writable<string | null>(null)

export const sessions = writable(new Map())

export const session = derived([pk, sessions], ([$pk, $sessions]) => $sessions.get($pk))

export const relayInfo = writable(new Map())

export const groupEvents = deriveEvents(repository, {
  filters: [{kinds: [GROUP_META]}],
})

export const groups = derived([relayInfo, groupEvents], ([$relayInfo, $groupEvents]) =>
  $groupEvents.filter(e => $relayInfo.get(getGroupUrl(e))?.pubkey === e.pubkey),
)

export const groupsById = derived(groups, $groups => indexBy(getIdentifier, $groups))

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
