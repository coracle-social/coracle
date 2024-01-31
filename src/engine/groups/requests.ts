import {Naddr} from "src/util/nostr"
import {load} from "src/engine/network/utils"
import {getUserHints} from "src/engine/relays/utils"
import {groups} from "./state"
import {deriveUserGroups, getGroupReqInfo} from "./utils"

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

export const loadGroupMessages = async (addresses: string[] = []) => {
  for (const address of addresses || deriveUserGroups().get()) {
    const {admins, recipients, relays, since} = getGroupReqInfo(address)
    const pubkeys = [...admins, ...recipients]

    load({relays, filters: [{kinds: [1059, 1060], "#p": pubkeys, since}]})
  }
}
