import {prop, sortBy, last, whereEq} from "ramda"
import {ellipsize} from "hurdak"
import {Tags} from "paravel"
import {Naddr} from "src/util/nostr"
import {pubkey} from "src/engine/session/state"
import {session} from "src/engine/session/derived"
import {getUserRelayUrls, mergeHints} from "src/engine/relays/utils"
import {groups, groupSharedKeys, groupAdminKeys} from "./state"
import type {Group} from "./model"
import {MembershipLevel, GroupAccess, MemberAccess} from "./model"

export const getGroupNaddr = (group: Group) =>
  Naddr.fromTagValue(group.address, group.relays).encode()

export const getGroupId = (group: Group) => group.address.split(":").slice(2).join(":")

export const getGroupName = (group: Group) => group.name || group.id

export const displayGroup = (group: Group) => ellipsize(group ? getGroupName(group) : "No name", 60)

export const getRecipientKey = wrap => {
  const pubkey = Tags.from(wrap).pubkeys().first()
  const sharedKey = groupSharedKeys.key(pubkey).get()

  if (sharedKey) {
    return sharedKey.privkey
  }

  const adminKey = groupAdminKeys.key(pubkey).get()

  if (adminKey) {
    return adminKey.privkey
  }

  return null
}

export const getGroupReqInfo = (address = null) => {
  let $groupSharedKeys = groupSharedKeys.get()
  let $groupAdminKeys = groupAdminKeys.get()

  if (address) {
    $groupSharedKeys = $groupSharedKeys.filter(whereEq({group: address}))
    $groupAdminKeys = $groupAdminKeys.filter(whereEq({group: address}))
  }

  const admins = []
  const recipients = [pubkey.get()]
  const relaysByGroup = []

  for (const key of [...$groupSharedKeys, ...$groupAdminKeys]) {
    admins.push(Naddr.fromTagValue(key.group).pubkey)

    recipients.push(key.pubkey)

    const group = groups.key(key.group).get()

    if (group?.relays) {
      relaysByGroup[group.address] = group.relays
    }
  }

  const relays = mergeHints([getUserRelayUrls("read"), ...Object.values(relaysByGroup)])

  return {admins, recipients, relays}
}

export const deriveSharedKeyForGroup = (address: string) =>
  groupSharedKeys.derived($keys =>
    last(sortBy(prop("created_at"), $keys.filter(whereEq({group: address}))))
  )

export const deriveAdminKeyForGroup = (address: string) => groupAdminKeys.key(address.split(":")[1])

export const deriveGroupAccess = address =>
  groups.key(address).derived($group => $group.access || GroupAccess.Closed)

export const deriveGroupStatus = address =>
  session.derived($session => $session?.groups?.[address] || {})

export const deriveMembershipLevel = address =>
  deriveGroupStatus(address).derived(({joined, access}) => {
    if (access === MemberAccess.Granted) {
      return MembershipLevel.Private
    }

    if (joined) {
      return MembershipLevel.Public
    }

    return MembershipLevel.None
  })
