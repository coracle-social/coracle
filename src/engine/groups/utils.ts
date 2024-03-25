import Fuse from "fuse.js"
import {identity, prop, uniqBy, map, defaultTo, sortBy, last, whereEq} from "ramda"
import {ellipsize, doPipe, seconds} from "hurdak"
import {Tags, decodeAddress, addressToNaddr} from "@coracle.social/util"
import {fuzzy} from "src/util/misc"
import type {GroupStatus, Session} from "src/engine/session/model"
import {pubkey} from "src/engine/session/state"
import {session} from "src/engine/session/derived"
import {deletes} from "src/engine/events/state"
import {forcePlatformRelays, hints} from "src/engine/relays/utils"
import {derivePerson, follows} from "src/engine/people/derived"
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

export const getWotGroupMembers = address =>
  Array.from(follows.get()).filter(pk =>
    derivePerson(pk)
      .get()
      .communities?.some(t => t[1] === address),
  )

export const searchGroups = groups.throttle(300).derived($groups => {
  const $deletes = deletes.get()
  const options = $groups
    .filter(group => !$deletes.has(group.address))
    .map(group => ({group, score: getWotGroupMembers(group.address).length}))

  const fuse = new Fuse(options, {
    keys: [{name: "id", weight: 0.2}, "meta.name", "meta.about"],
    threshold: 0.3,
    shouldSort: false,
    includeScore: true,
  })

  return (term: string) => {
    if (!term) {
      return sortBy(item => -item.score, options).map(item => item.group)
    }

    return doPipe(fuse.search(term), [
      sortBy((r: any) => r.score - Math.pow(Math.max(0, r.item.score), 1 / 100)),
      map((r: any) => r.item.group),
    ])
  }
})

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
