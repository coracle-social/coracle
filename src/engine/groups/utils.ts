import {identity, prop, uniqBy, defaultTo, sortBy, last, whereEq} from "ramda"
import {ellipsize, seconds} from "hurdak"
import {Tags, decodeAddress, addressToNaddr} from "paravel"
import {fuzzy} from "src/util/misc"
import type {GroupStatus, Session} from "src/engine/session/model"
import {env, pubkey} from "src/engine/session/state"
import {session} from "src/engine/session/derived"
import {forcePlatformRelays, hints} from "src/engine/relays/utils"
import {groups, groupSharedKeys, groupAdminKeys} from "./state"
import {GroupAccess} from "./model"
import type {Group} from "./model"

export const getGroupNaddr = (group: Group) =>
  addressToNaddr(decodeAddress(group.address, group.relays))

export const getGroupId = (group: Group) => group.address.split(":").slice(2).join(":")

export const getGroupName = (group: Group) => group.meta?.name || group.id || ""

export const displayGroup = (group: Group) => ellipsize(group ? getGroupName(group) : "No name", 60)

export const deriveGroup = address => {
  const {pubkey, identifier: id} = decodeAddress(address)

  return groups.key(address).derived(defaultTo({id, pubkey, address}))
}

export const getGroupSearch = $groups => fuzzy($groups, {keys: ["meta.name", "meta.about"]})

export const searchGroups = groups.derived(getGroupSearch)

export const getRecipientKey = wrap => {
  const pubkey = Tags.fromEvent(wrap).values("p").first()
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
  let since = session.get()?.groups_last_synced || 0
  let $groupSharedKeys = groupSharedKeys.get()
  let $groupAdminKeys = groupAdminKeys.get()

  if (address) {
    since = session.get()?.groups?.[address]?.last_synced || 0
    $groupSharedKeys = $groupSharedKeys.filter(whereEq({group: address}))
    $groupAdminKeys = $groupAdminKeys.filter(whereEq({group: address}))
  }

  // Account for timestamp randomization
  since = Math.max(0, since - seconds(7, "day"))

  const admins = []
  const addresses = []
  const recipients = [pubkey.get()].filter(identity)

  for (const key of [...$groupSharedKeys, ...$groupAdminKeys]) {
    const address = decodeAddress(key.group)

    admins.push(address.pubkey)
    addresses.push(key.group)
    recipients.push(key.pubkey)
  }

  const relays = forcePlatformRelays(hints.WithinMultipleContexts(addresses).getUrls())

  return {admins, recipients, relays, since}
}

export const getCommunityReqInfo = (address = null) => {
  const {groups, groups_last_synced} = session.get() || {}
  const since = groups?.[address]?.last_synced || groups_last_synced || 0

  return {
    since: since - seconds(6, "hour"),
    relays: forcePlatformRelays(hints.WithinContext(address).getUrls()),
  }
}

export const deriveSharedKeyForGroup = (address: string) =>
  groupSharedKeys.derived($keys =>
    last(sortBy(prop("created_at"), $keys.filter(whereEq({group: address})))),
  )

export const deriveAdminKeyForGroup = (address: string) => groupAdminKeys.key(address.split(":")[1])

export const getGroupStatus = (session, address) =>
  (session?.groups?.[address] || {}) as GroupStatus

export const deriveGroupStatus = address =>
  session.derived($session => getGroupStatus($session, address))

export const getIsGroupMember = (session, address, includeRequests = false) => {
  const status = getGroupStatus(session, address)

  if (address.startsWith("34550:")) {
    return status.joined
  }

  if (address.startsWith("35834:")) {
    if (includeRequests && status.access === GroupAccess.Requested) {
      return true
    }

    return status.access === GroupAccess.Granted
  }

  return false
}

export const deriveIsGroupMember = (address, includeRequests = false) =>
  session.derived($session => getIsGroupMember($session, address, includeRequests))

export const deriveGroupOptions = (defaultGroups = []) =>
  session.derived($session => {
    const options = []

    for (const address of Object.keys($session?.groups || {})) {
      const group = groups.key(address).get()

      if (group && deriveIsGroupMember(address).get()) {
        options.push(group)
      }
    }

    for (const address of defaultGroups) {
      options.push({address})
    }

    return uniqBy(prop("address"), options)
  })

export const getUserCircles = (session: Session) =>
  Object.entries(session?.groups || {})
    .filter(([a, s]) => deriveIsGroupMember(a).get())
    .map(([a, s]) => a)

export const deriveUserCircles = () => session.derived(getUserCircles)

export const getUserGroups = (session: Session) =>
  getUserCircles(session).filter(a => a.startsWith("35834:"))

export const deriveUserGroups = () => session.derived(getUserGroups)

export const getUserCommunities = (session: Session) =>
  getUserCircles(session).filter(a => a.startsWith("34550:"))

export const deriveUserCommunities = () => session.derived(getUserCommunities)
