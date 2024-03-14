import {nip19} from "nostr-tools"
import {Router} from "paravel"
import {normalizeRelayUrl as normalize, ConnectionStatus, fromNostrURI} from "paravel"
import {sortBy, whereEq, pluck, uniq, prop, last} from "ramda"
import {displayList, switcher} from "hurdak"
import {fuzzy} from "src/util/misc"
import {LOCAL_RELAY_URL} from "src/util/nostr"
import {env} from "src/engine/session/state"
import {stateKey} from "src/engine/session/derived"
import {people} from "src/engine/people/state"
import {groups, groupSharedKeys} from "src/engine/groups/state"
import {pool} from "src/engine/network/state"
import {getSetting} from "src/engine/session/utils"
import type {Relay} from "./model"

export const normalizeRelayUrl = (url: string) => {
  if (url === LOCAL_RELAY_URL) {
    return url
  }

  try {
    return normalize(url)
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

export const getRelaySearch = $relays => fuzzy($relays, {keys: ["url", "name", "description"]})

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
  getDefaultRelays: () => [
    ...getUserRelayUrls(),
    ...env.get().PLATFORM_RELAYS,
    ...env.get().DEFAULT_RELAYS,
  ],
  getDefaultLimit: () => parseInt(getSetting("relay_limit")),
  getRelayQuality: (url: string) => {
    const connection = pool.get(url, {autoConnect: false})

    return switcher(connection?.meta.getStatus(), {
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
