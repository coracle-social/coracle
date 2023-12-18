import {Naddr} from "src/util/nostr"
import {groups} from "src/engine/groups/state"
import {getUserHints} from "src/engine/relays/utils"
import {load} from "src/engine/network/utils"

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

    if (!group?.name) {
      stale.add(addr)
    }
  }

  return Array.from(stale)
}

export const loadGroups = async (rawAddrs: string[]) => {
  const naddrs = getStaleAddrs(rawAddrs).map(a => Naddr.fromTagValue(a))
  const authors = naddrs.map(naddr => naddr.pubkey)
  const identifiers = naddrs.map(naddr => naddr.identifier)

  return load({
    relays: getUserHints("read"),
    filters: [{kinds: [34550], authors, "#d": identifiers}],
  })
}
