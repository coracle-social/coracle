import {now} from "paravel"
import {seconds} from "hurdak"
import {Naddr, noteKinds, repostKinds} from "src/util/nostr"
import {load} from "src/engine/network/utils"
import {getUserHints} from "src/engine/relays/utils"
import {updateCurrentSession} from "src/engine/session/commands"
import {groups} from "./state"
import {
  deriveUserCircles,
  deriveUserGroups,
  deriveUserCommunities,
  getGroupReqInfo,
  getCommunityReqInfo,
} from "./utils"

export const attemptedAddrs = new Map()

export const getStaleAddrs = (addrs: string[]) => {
  const stale = new Set()

  for (const addr of addrs) {
    const attempts = attemptedAddrs.get(addr) | 0

    if (attempts > 1) {
      continue
    }

    attemptedAddrs.set(addr, attempts + 1)

    const group = groups.key(addr).get()

    if (!group?.meta) {
      stale.add(addr)
    }
  }

  return Array.from(stale)
}

export const loadGroups = async (rawAddrs: string[], relays: string[] = null) => {
  const naddrs = getStaleAddrs(rawAddrs).map(a => Naddr.fromTagValue(a))
  const authors = naddrs.map(naddr => naddr.pubkey)
  const identifiers = naddrs.map(naddr => naddr.identifier)

  if (naddrs.length > 0) {
    load({
      relays: relays || getUserHints("read"),
      filters: [{kinds: [34550, 35834], authors, "#d": identifiers}],
    })
  }
}

export const loadGroupMessages = async () => {
  for (const address of deriveUserGroups().get()) {
    const {admins, recipients, relays, since} = getGroupReqInfo(address)
    const pubkeys = [...admins, ...recipients]

    load({relays, filters: [{kinds: [1059, 1060], "#p": pubkeys, since}]})
  }

  for (const address of deriveUserCommunities().get()) {
    const info = getCommunityReqInfo(address)
    const kinds = [...noteKinds, ...repostKinds]
    const since = Math.max(now() - seconds(7, "day"), info.since)

    load({relays: info.relays, filters: [{kinds, "#a": [address], since}]})
  }

  updateCurrentSession($session => {
    for (const address of deriveUserCircles().get()) {
      $session.groups[address].last_synced = now()
    }

    return $session
  })
}
