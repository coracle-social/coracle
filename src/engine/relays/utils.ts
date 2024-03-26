import {nip19} from "nostr-tools"
import {shuffle} from "@coracle.social/lib"
import {Router} from "@coracle.social/util"
import {normalizeRelayUrl as normalize, fromNostrURI} from "@coracle.social/util"
import {ConnectionStatus} from "@coracle.social/network"
import {sortBy, whereEq, pluck, uniq, prop, last} from "ramda"
import {displayList, chunk, switcher} from "hurdak"
import {fuzzy, pushToKey} from "src/util/misc"
import {LOCAL_RELAY_URL} from "src/util/nostr"
import {env} from "src/engine/session/state"
import {getSetting} from "src/engine/session/utils"
import {stateKey} from "src/engine/session/derived"
import {people} from "src/engine/people/state"
import {groups, groupSharedKeys} from "src/engine/groups/state"
import {pool} from "src/engine/network/state"
import type {Relay} from "./model"
import {relays} from "./state"

export const normalizeRelayUrl = (url: string, opts = {}) => {
  if (url === LOCAL_RELAY_URL) {
    return url
  }

  try {
    return normalize(url, opts)
  } catch (e) {
    return url
  }
}

export const urlToRelay = url => ({url: normalizeRelayUrl(url)}) as Relay

export const decodeRelay = entity => {
  entity = fromNostrURI(entity)

  try {
    return {url: nip19.decode(entity).data}
  } catch (e) {
    return {url: entity}
  }
}

export const displayRelay = ({url}: Relay) => last(url.split("://")).replace(/\/$/, "")

export const displayRelays = (relays: Relay[], max = 3) =>
  displayList(relays.map(displayRelay), "and", max)

export const getRelaySearch = ($relays: Relay[]) => {
  const search = fuzzy($relays, {keys: ["url", "name", "description"]})

  return term => {
    if (!term) {
      return sortBy(r => -r.count || 0, $relays)
    }

    return search(term)
  }
}

export const getSearchableRelays = ($relays: Relay[]) => {
  const urls = pluck(
    "url",
    $relays.filter(r => (r.info?.supported_nips || []).includes(50)),
  )

  return uniq(env.get().SEARCH_RELAYS.concat(urls)).slice(0, 8) as string[]
}

export const getPubkeyRelays = (pubkey: string, mode: string = null) => {
  const relays = people.key(pubkey).get()?.relays || []

  return mode ? relays.filter(prop(mode)) : relays
}

export const getPubkeyRelayUrls = (pubkey: string, mode: string = null) =>
  pluck("url", getPubkeyRelays(pubkey, mode))

export const getUserRelays = (mode: string = null) => getPubkeyRelays(stateKey.get(), mode)

export const getUserRelayUrls = (mode: string = null) => pluck("url", getUserRelays(mode))

export const getGroupRelayUrls = address => {
  const group = groups.key(address).get()
  const keys = groupSharedKeys.get()

  if (group?.relays) {
    return group.relays
  }

  const latestKey = last(sortBy(prop("created_at"), keys.filter(whereEq({group: address}))))

  if (latestKey?.hints) {
    return latestKey.hints
  }

  return []
}

export const forcePlatformRelays = relays => {
  const {PLATFORM_RELAYS} = env.get()

  if (PLATFORM_RELAYS.length > 0) {
    return Array.from(PLATFORM_RELAYS)
  }

  return relays
}

export const hints = new Router({
  getUserPubkey: () => stateKey.get(),
  getGroupRelays: getGroupRelayUrls,
  getCommunityRelays: getGroupRelayUrls,
  getPubkeyRelays: getPubkeyRelayUrls,
  getDefaultRelays: () => [...env.get().PLATFORM_RELAYS, ...env.get().DEFAULT_RELAYS],
  getDefaultLimit: () => parseInt(getSetting("relay_limit")),
  getRelayQuality: (url: string) => {
    const oneMinute = 60 * 1000
    const oneDay = 24 * 60 * oneMinute
    const connection = pool.get(url, {autoConnect: false})

    // If we haven't connected, consult our relay record and see if there has
    // been a recent fault. If there has been, penalize the relay.
    if (!connection) {
      const lastFault = relays.key(url).get()?.last_fault || 0
      const timeSinceFault = Date.now() - oneMinute - lastFault

      return Math.max(0, Math.min(0.5, timeSinceFault / oneDay))
    }

    return switcher(connection.meta.getStatus(), {
      [ConnectionStatus.Unauthorized]: 0.5,
      [ConnectionStatus.Forbidden]: 0,
      [ConnectionStatus.Error]: 0,
      [ConnectionStatus.Closed]: 0.6,
      [ConnectionStatus.Slow]: 0.5,
      [ConnectionStatus.Ok]: 1,
      default: 0.5,
    })
  },
})

export const getPubkeyRelayChunks = (pubkeys: string[]) => {
  const relayLimit = getSetting('relay_limit')
  const pubkeysByRelay = new Map()

  for (const pubkeyChunk of chunk(relayLimit, shuffle(pubkeys))) {
    for (const relay of hints.FromPubkeys(pubkeyChunk).getUrls()) {
      for (const pubkey of pubkeyChunk) {
        if (pubkeysByRelay.get(relay)?.length === 256) {
          break
        }

        pushToKey(pubkeysByRelay, relay, pubkey)
      }
    }
  }

  return shuffle(Array.from(pubkeysByRelay.entries())).slice(0, relayLimit)
}
