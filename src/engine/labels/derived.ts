import {whereEq} from 'ramda'
import {derivedCollection} from "src/engine/core/utils"
import {deletes} from "src/engine/events/state"
import {pubkey} from "src/engine/session/state"
import type {Event} from 'src/engine/events/model'
import {_labels} from "./state"

export const labels = derivedCollection<Event>(
  'id',
  [_labels, deletes],
  ([$l, $d]) => $l.filter(l => !$d.has(l.id))
)

export const userLabels = derivedCollection<Event>(
  'id',
  [labels, pubkey],
  ([$l, $pk]) => $l.filter(whereEq({pubkey: $pk}))
)
