import {find, whereEq} from "ramda"
import {Tags} from "src/util/nostr"
import {loadOne, getIdFilters} from "src/engine/network/utils"
import {selectHints} from "src/engine/relays/utils"

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
      relays: selectHints(relays),
      filters: getIdFilters([eid]),
    })
  }

  if (kind && pubkey) {
    const note = find(e => {
      if (!whereEq({kind, pubkey}, e)) {
        return false
      }

      return !identifier || Tags.from(e).getMeta("d") === identifier
    }, context)

    if (note) {
      return note
    }

    return loadOne({
      relays: selectHints(relays),
      filters: [{kinds: [kind], authors: [pubkey], "#d": [identifier]}],
    })
  }

  return null
}
