import {omit} from "ramda"
import {shuffle} from "hurdak"
import type {DynamicFilter, Filter} from "src/engine2/model"
import {env} from "src/engine2/state"
import {follows, network} from "src/engine2/queries"

export const getIdFilter = id => {
  if (id.includes(":")) {
    const [kind, pubkey, d] = id.split(":")

    return {kinds: [parseInt(kind)], authors: [pubkey], "#d": [d]}
  }

  return {ids: [id]}
}

export const getPubkeysWithDefaults = (pubkeys: string[]) =>
  shuffle(pubkeys.length > 0 ? pubkeys : (env.get().DEFAULT_FOLLOWS as string[])).slice(0, 1024)

export const compileFilter = (filter: DynamicFilter): Filter => {
  if (filter.authors === "global") {
    filter = omit(["authors"], filter)
  } else if (filter.authors === "follows") {
    filter = {...filter, authors: getPubkeysWithDefaults(follows.get())}
  } else if (filter.authors === "network") {
    filter = {...filter, authors: getPubkeysWithDefaults(network.get())}
  }

  return filter as Filter
}
