import {whereEq} from "ramda"
import {derivedCollection} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {deletes} from "src/engine/events/state"
import {pubkey} from "src/engine/session/state"
import {_labels} from "./state"

export const labels = derivedCollection<TrustedEvent>("id", [_labels, deletes], ([$l, $d]) =>
  $l.filter(l => !$d.has(l.id)),
)

export const userLabels = derivedCollection<TrustedEvent>("id", [labels, pubkey], ([$l, $pk]) =>
  $l.filter(whereEq({pubkey: $pk})),
)
