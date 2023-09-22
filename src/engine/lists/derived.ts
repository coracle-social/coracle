import {whereEq} from "ramda"
import {derived} from "src/engine/core/utils"
import {pubkey} from "src/engine/session/state"
import {lists} from "src/engine/lists/state"
import {deletesSet} from "src/engine/events/derived"

export const activeLists = derived([lists, deletesSet], ([$lists, $deletesSet]) =>
  $lists.filter($l => !$deletesSet.has($l.naddr))
)

export const userLists = derived([pubkey, activeLists], ([$pubkey, $activeLists]) =>
  $activeLists.filter(whereEq({pubkey: $pubkey}))
)
