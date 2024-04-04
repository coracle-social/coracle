import {nip19} from "nostr-tools"
import {pushToMapKey} from "@coracle.social/lib"
import {
  Router,
  normalizeRelayUrl as normalize,
  getFilterId,
  fromNostrURI,
  mergeFilters,
} from "@coracle.social/util"
import type {Filter} from "@coracle.social/util"
import {ConnectionStatus, NetworkContext} from "@coracle.social/network"
import {sortBy, whereEq, pluck, uniq, prop, last} from "ramda"
import {displayList, switcher} from "hurdak"
import {fuzzy} from "src/util/misc"
import {LOCAL_RELAY_URL} from "src/util/nostr"
import {env} from "src/engine/session/state"
import {getSetting} from "src/engine/session/utils"
import {stateKey} from "src/engine/session/derived"
import type {RelayFilters} from "src/engine/network/utils"
import {people} from "src/engine/people/state"
import {groups, groupSharedKeys} from "src/engine/groups/state"
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

export const forceRelays = (relays: string[], forceRelays: string[]) =>
  forceRelays.length > 0 ? forceRelays : relays

export const forcePlatformRelays = (relays: string[]) =>
  forceRelays(relays, Array.from(env.get().PLATFORM_RELAYS))

export const forceRelaySelections = (selections: RelayFilters[], forceRelays: string[]) => {
  if (forceRelays.length === 0) {
    return selections
  }

  const filtersById = new Map<string, Filter>()
  const newSelections = new Map<string, string[]>()

  for (const {filters} of selections) {
    for (const forceRelay of forceRelays) {
      for (const filter of filters) {
        const id = getFilterId(filter)

        filtersById.set(id, filter)
        pushToMapKey(newSelections, forceRelay, id)
      }
    }
  }

  return hints.relaySelectionsFromMap(newSelections).map(({values, relay}) => ({
    relay,
    filters: mergeFilters(values.map(id => filtersById.get(id))),
  }))
}

export const forcePlatformRelaySelections = (selections: RelayFilters[]) =>
  forceRelaySelections(selections, Array.from(env.get().PLATFORM_RELAYS))

export const useRelaysWithFallbacks = relays =>
  relays.length > 0 ? relays : env.get().DEFAULT_RELAYS

export const hints = new Router({
  getUserPubkey: () => stateKey.get(),
  getGroupRelays: getGroupRelayUrls,
  getCommunityRelays: getGroupRelayUrls,
  getPubkeyRelays: getPubkeyRelayUrls,
  getStaticRelays: () => [...env.get().PLATFORM_RELAYS, ...env.get().DEFAULT_RELAYS],
  getIndexerRelays: () => env.get().INDEXER_RELAYS,
  getSearchRelays: () => env.get().SEARCH_RELAYS,
  getLimit: () => parseInt(getSetting("relay_limit")),
  getRedundancy: () => parseInt(getSetting("relay_redundancy")),
  getRelayQuality: (url: string) => {
    const oneMinute = 60 * 1000
    const oneHour = 60 * oneMinute
    const oneDay = 24 * oneHour
    const oneWeek = 7 * oneDay
    const connection = NetworkContext.pool.get(url, {autoConnect: false})

    // If we haven't connected, consult our relay record and see if there has
    // been a recent fault. If there has been, penalize the relay. If there have been several,
    // don't use the relay.
    if (!connection) {
      const faults = relays.key(url).get()?.faults || []
      const lastFault = last(faults) || 0

      if (faults.filter(n => n > Date.now() - oneHour).length > 2) {
        return 0
      }

      if (faults.filter(n => n > Date.now() - oneDay).length > 5) {
        return 0
      }

      if (faults.filter(n => n > Date.now() - oneWeek).length > 10) {
        return 0
      }

      return Math.max(0, Math.min(0.5, (Date.now() - oneMinute - lastFault) / oneDay))
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
