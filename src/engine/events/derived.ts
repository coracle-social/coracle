import {whereEq} from "ramda"
import {DerivedCollection} from "src/engine/core/utils"
import {pubkey} from "src/engine/session/state"
import type {Event} from "./model"
import {deletes, _events} from "./state"

export const events = new DerivedCollection<Event>("id", [_events, deletes], ([$e, $d]) =>
  $e.filter(e => !$d.has(e.id))
)

export const userEvents = new DerivedCollection<Event>("id", [events, pubkey], ([$e, $pk]) =>
  $pk ? $e.filter(whereEq({pubkey: $pk})) : []
)
