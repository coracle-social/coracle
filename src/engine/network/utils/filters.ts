import type {Filter} from "@coracle.social/util"
import {isContextAddress} from "@coracle.social/util"
import {omit, without} from "ramda"
import {shuffle} from "hurdak"
import {env} from "src/engine/session/state"
import {follows, network} from "src/engine/people/derived"
import {hints} from "src/engine/relays/utils"
import type {DynamicFilter} from "../model"

export const getPubkeysWithDefaults = (pubkeys: Set<string>) => {
  if (pubkeys.size === 0) {
    pubkeys = new Set(env.get().DEFAULT_FOLLOWS)
  }

  return shuffle(Array.from(pubkeys)).slice(0, 1000)
}

export type CompileFiltersOpts = {
  includeReposts?: boolean
}

export const compileFilters = (filters: DynamicFilter[], opts: CompileFiltersOpts = {}) => {
  // Dereference authors
  filters = filters.map(filter => {
    if (filter.authors === "global") {
      filter = omit(["authors"], filter)
    } else if (filter.authors === "follows") {
      filter = {...filter, authors: getPubkeysWithDefaults(follows.get())}
    } else if (filter.authors === "network") {
      filter = {...filter, authors: getPubkeysWithDefaults(network.get())}
    }

    return filter
  })

  // Add repost filters
  if (opts.includeReposts) {
    filters = filters.flatMap(original => {
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
  }

  return filters as Filter[]
}

export const getRelaysFromFilters = filters =>
  hints
    .merge(
      filters.map(filter => {
        if (filter["#a"]?.some(isContextAddress)) {
          return hints.WithinMultipleContexts(filter["#a"].filter(isContextAddress))
        }

        if (filter.authors) {
          return hints.FromPubkeys(shuffle(filter.authors))
        }

        return hints.ReadRelays().policy(hints.addMinimalFallbacks)
      }),
    )
    .policy(hints.addNoFallbacks)
    .getUrls()
