import {whereEq, sortBy} from "ramda"
import {derivedCollection} from "src/engine/core/utils"
import {pubkey} from "src/engine/session/state"
import {deletes} from "src/engine/events/state"
import type {List} from "./model"
import {_lists} from "./state"

export const lists = derivedCollection<List>("address", [_lists, deletes], ([$l, $d]) =>
  $l.filter(l => !$d.has(l.address))
)

export const userLists = derivedCollection<List>("address", [lists, pubkey], ([$l, $pk]) =>
  sortBy(l => l.name.toLowerCase(), $l.filter(whereEq({pubkey: $pk})))
)
