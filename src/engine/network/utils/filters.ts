import {shuffle, splitAt} from "@coracle.social/lib"
import type {Filter, RouterScenario, RouterScenarioOptions} from "@coracle.social/util"
import {isContextAddress, mergeFilters, getFilterId, decodeAddress} from "@coracle.social/util"
import {without, sortBy, prop} from "ramda"
import {switcherFn} from "hurdak"
import {env} from "src/engine/session/state"
import {user} from "src/engine/session/derived"
import {getSetting} from "src/engine/session/utils"
import {getFollowedPubkeys, getNetwork} from "src/engine/people/utils"
import {hints} from "src/engine/relays/utils"

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

export type RelayFilters = {
  relay: string
  filters: Filter[]
}

export const getFilterSelections = (
  filters: Filter[],
  options: RouterScenarioOptions = {},
): RelayFilters[] => {
  const scenarios: RouterScenario[] = []
  const filtersById = new Map<string, Filter>()

  for (const filter of filters) {
    if (filter.search) {
      const id = getFilterId(filter)

      filtersById.set(id, filter)
      scenarios.push(hints.product([id], hints.options.getSearchRelays()))
    } else {
      const contexts = filter["#a"]?.filter(a => isContextAddress(decodeAddress(a)))

      if (contexts?.length > 0) {
        for (const {relay, values} of hints
          .WithinMultipleContexts(contexts)
          .policy(hints.addMinimalFallbacks)
          .getSelections()) {
          const contextFilter = {...filter, "#a": Array.from(values)}
          const id = getFilterId(contextFilter)

          filtersById.set(id, contextFilter)
          scenarios.push(hints.product([id], [relay]))
        }
      } else if (filter.authors) {
        for (const {relay, values} of hints
          .FromPubkeys(filter.authors)
          .policy(hints.addMinimalFallbacks)
          .getSelections()) {
          const authorsFilter = {...filter, authors: Array.from(values)}
          const id = getFilterId(authorsFilter)

          filtersById.set(id, authorsFilter)
          scenarios.push(hints.product([id], [relay]))
        }
      } else {
        const id = getFilterId(filter)

        filtersById.set(id, filter)
        scenarios.push(
          hints.product([id], hints.ReadRelays().policy(hints.addMinimalFallbacks).getUrls()),
        )
      }
    }
  }

  const selections = sortBy(
    ({filters}) => -filters[0].authors?.length,
    hints
      .merge(scenarios)
      .clone(options)
      .getSelections()
      .map(({values, relay}) => ({
        filters: values.map((id: string) => filtersById.get(id) as Filter),
        relay,
      })),
  )

  // Pubkey-based selections can get really big. Use the most popular relays for the long tail
  const [keep, discard] = splitAt(getSetting("relay_limit"), selections)

  for (const target of keep.slice(0, getSetting("relay_redundancy"))) {
    target.filters = mergeFilters(discard.concat(target).flatMap(prop("filters")))
  }

  return keep
}
