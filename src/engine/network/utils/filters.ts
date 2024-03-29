import {shuffle, first} from "@coracle.social/lib"
import type {Filter} from "@coracle.social/util"
import {isContextAddress, decodeAddress} from "@coracle.social/util"
import {without, sortBy} from "ramda"
import {switcherFn} from "hurdak"
import {pushToKey} from "src/util/misc"
import {env} from "src/engine/session/state"
import {user} from "src/engine/session/derived"
import {getFollowedPubkeys, getNetwork} from "src/engine/people/utils"
import {hints, getPubkeyRelayUrls} from "src/engine/relays/utils"
import {searchableRelays} from "src/engine/relays/derived"

export enum FilterScope {
  Follows = "follows",
  Network = "network",
  FollowsAndNetwork = "follows-and-network",
  FollowsAndSelf = "follows-and-self",
  Custom = "custom",
  Global = "global",
}

export type DynamicFilter = Filter & {
  scope?: FilterScope
}

export const compileFilters = (filters: DynamicFilter[]) =>
  filters
    // Dereference authors
    .map(({scope, ...filter}) => {
      if (filter.authors || !scope || [FilterScope.Global, FilterScope.Custom].includes(scope)) {
        return filter
      }

      const $user = user.get()

      let pubkeys = switcherFn(scope, {
        [FilterScope.Follows]: () => shuffle(getFollowedPubkeys($user)),
        [FilterScope.Network]: () => shuffle(getNetwork($user)),
        [FilterScope.FollowsAndNetwork]: () =>
          shuffle([...getFollowedPubkeys($user), ...getNetwork($user)]),
        [FilterScope.FollowsAndSelf]: () => {
          const result = shuffle(getFollowedPubkeys($user))

          if ($user) {
            result.push($user.pubkey)
          }

          return result
        },
      })

      if (pubkeys.length === 0) {
        pubkeys = env.get().DEFAULT_FOLLOWS
      }

      return {...filter, authors: pubkeys.slice(0, 1000)}
    }) as Filter[]

export const addRepostFilters = (filters: Filter[]) =>
  filters.flatMap(original => {
    const filterChunk = [original]

    if (!original.kinds) {
      filterChunk.push({...original, kinds: [6, 16]})
    } else {
      if (original.kinds.includes(1)) {
        filterChunk.push({...original, kinds: [6]})
      }

      const otherKinds = without([1], original.kinds)

      if (otherKinds.length > 0) {
        filterChunk.push({...original, kinds: [16], "#k": otherKinds.map(String)})
      }
    }

    return filterChunk
  })

export type RelayFilters = [string, Filter[]]

export const getRelayFilters = (
  filters: Filter[],
  {skipPlatform = false, forceRelays = []} = {},
): RelayFilters[] => {
  const {PLATFORM_RELAYS} = env.get()

  if (PLATFORM_RELAYS.length > 0 && !skipPlatform) {
    return PLATFORM_RELAYS.map(relay => [relay, filters])
  }

  if (forceRelays.length > 0) {
    return forceRelays.map(relay => [relay, filters])
  }

  const filterRelays = new Map<string, Filter[]>()

  for (const filter of filters) {
    if (filter.search) {
      for (const relay of hints.scenario([searchableRelays.get()]).getUrls()) {
        pushToKey(filterRelays, relay, filter)
      }
    } else {
      const contexts = filter["#a"]?.filter(a => isContextAddress(decodeAddress(a)))

      if (contexts?.length > 0) {
        for (const relay of hints.WithinMultipleContexts(contexts).getUrls()) {
          pushToKey(filterRelays, relay, filter)
        }
      } else if (filter.authors) {
        for (const [relay, authors] of getRelayPubkeys(filter.authors)) {
          pushToKey(filterRelays, relay, {...filter, authors})
        }
      } else {
        for (const relay of hints.ReadRelays().policy(hints.addMinimalFallbacks).getUrls()) {
          pushToKey(filterRelays, relay, filter)
        }
      }
    }
  }

  return Array.from(filterRelays.entries())
}

export type RelayPubkeys = [string, string[]]

export const getRelayPubkeys = (pubkeys: string[]) => {
  const fallback = first(shuffle(env.get().DEFAULT_RELAYS))
  const relaysByPubkey = new Map<string, string[]>()
  const pubkeysByRelay = new Map<string, string[]>()

  for (const pubkey of pubkeys) {
    const relays = getPubkeyRelayUrls(pubkey, "write").filter(
      relay => hints.options.getRelayQuality(relay) > 0,
    )

    if (relays.length === 0) {
      pushToKey(relaysByPubkey, pubkey, fallback)
      pushToKey(pubkeysByRelay, fallback, pubkey)
    } else {
      for (const relay of relays) {
        pushToKey(relaysByPubkey, pubkey, relay)
        pushToKey(pubkeysByRelay, relay, pubkey)
      }
    }
  }

  const seen = new Map<string, number>()
  const result: RelayPubkeys[] = []
  const sortKey = ([url, pubkeys]) => -pubkeys.length * hints.options.getRelayQuality(url)
  for (const [relay] of sortBy(sortKey, Array.from(pubkeysByRelay))) {
    const pubkeys = []
    for (const pubkey of pubkeysByRelay.get(relay)) {
      const timesSeen = seen.get(pubkey) || 0

      if (timesSeen < 2) {
        seen.set(pubkey, timesSeen + 1)
        pubkeys.push(pubkey)
      }
    }

    if (pubkeys.length > 0) {
      result.push([relay, pubkeys])
    }
  }

  return result
}
