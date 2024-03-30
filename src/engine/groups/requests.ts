import {now} from "@coracle.social/lib"
import {decodeAddress, isGroupAddress} from "@coracle.social/util"
import {seconds} from "hurdak"
import {partition} from "ramda"
import {noteKinds, giftWrapKinds, repostKinds} from "src/util/nostr"
import {load} from "src/engine/network/utils"
import {forcePlatformRelays, hints} from "src/engine/relays/utils"
import {updateCurrentSession} from "src/engine/session/commands"
import {groups} from "./state"
import {deriveUserCircles, getGroupReqInfo, getCommunityReqInfo} from "./utils"

export const attemptedAddrs = new Map()

export const getStaleAddrs = (addrs: string[]) => {
  const stale = new Set<string>()

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

export const loadGroups = async (rawAddrs: string[], relays: string[] = []) => {
  const addrs = getStaleAddrs(rawAddrs)
  const authors = addrs.map(a => decodeAddress(a).pubkey)
  const identifiers = addrs.map(a => decodeAddress(a).identifier)

  if (addrs.length > 0) {
    load({
      relays: forcePlatformRelays(
        hints
          .merge([hints.addressScenario(addrs, relays), hints.WithinMultipleContexts(addrs)])
          .getUrls(),
      ),
      filters: [{kinds: [34550, 35834], authors, "#d": identifiers}],
    })
  }
}

export const loadGroupMessages = async (addresses?: string[]) => {
  const addrs = addresses || deriveUserCircles().get()
  const [groupAddrs, communityAddrs] = partition(a => isGroupAddress(decodeAddress(a)), addrs)

  for (const address of groupAddrs) {
    const {admins, recipients, relays, since} = getGroupReqInfo(address)
    const pubkeys = [...admins, ...recipients]

    if (pubkeys.length > 0) {
      load({relays, filters: [{kinds: giftWrapKinds, "#p": pubkeys, since}]})
    }
  }

  for (const address of communityAddrs) {
    const {relays, ...info} = getCommunityReqInfo(address)
    const kinds = [...noteKinds, ...repostKinds]
    const since = Math.max(now() - seconds(7, "day"), info.since)

    load({relays, filters: [{kinds, "#a": [address], since}]})
  }

  updateCurrentSession($session => {
    for (const address of addrs) {
      if ($session.groups?.[address]) {
        $session.groups[address].last_synced = now()
      }
    }

    return $session
  })
}
