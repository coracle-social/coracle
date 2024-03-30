import type {Event} from "nostr-tools"
import {find, whereEq} from "ramda"
import {getIdFilters, Tags} from "@coracle.social/util"
import {loadOne} from "src/engine/network/utils"
import {useRelaysWithFallbacks} from "src/engine/relays/utils"

export const dereferenceNote = async ({
  eid = null,
  kind = null,
  pubkey = null,
  identifier = null,
  relays = [],
  context = [],
}) => {
  if (eid) {
    const note = find(whereEq({id: eid}), context)

    if (note) {
      return note
    }

    return loadOne({
      relays: useRelaysWithFallbacks(relays),
      filters: getIdFilters([eid]),
    })
  }

  if (kind && pubkey) {
    const note = find(e => {
      if (!whereEq({kind, pubkey}, e)) {
        return false
      }

      return !identifier || Tags.fromEvent(e).get("d")?.value() === identifier
    }, context)

    if (note) {
      return note
    }

    return loadOne({
      relays: useRelaysWithFallbacks(relays),
      filters: [{kinds: [kind], authors: [pubkey], "#d": [identifier]}],
    }).then((event: Event) => {
      return note?.created_at > event.created_at ? note : event
    })
  }

  return null
}
