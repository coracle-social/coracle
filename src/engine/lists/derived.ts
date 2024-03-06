import {whereEq, sortBy} from "ramda"
import {derivedCollection} from "src/engine/core/utils"
import {pubkey} from "src/engine/session/state"
import {deletes} from "src/engine/events/state"
import type {List} from "./model"
import {_lists} from "./state"

export const lists = derivedCollection<List>("address", [_lists, deletes], ([$l, $d]) =>
  $l.filter(l => !$d.has(l.address)),
)

export const userLists = derivedCollection<List>("address", [lists, pubkey], ([$l, $pk]) => {
  const m = new Map()
  const getName = (l: any) => (l.title || l.name).toLowerCase()

  for (const list of $l.filter(whereEq({pubkey: $pk}))) {
    const name = getName(list)

    if (!m.has(name) || list.address.startsWith("30003")) {
      m.set(name, list)
    }
  }

  return sortBy(getName, Array.from(m.values()))
})
