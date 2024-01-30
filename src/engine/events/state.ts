import {Tags} from "paravel"
import {Collection, Writable} from "src/engine/core/utils"
import type {Event} from "./model"

export const _events = new Collection<Event>("id", 1000)
export const seen = new Collection<Event>("id", 1000)
export const seenIds = new Writable(new Set<string>(), 1000)
export const deletes = new Writable(new Set<string>(), 10000)

seen.subscribe($seen => {
  seenIds.update($seenIds => {
    for (const id of new Set<string>(Tags.from($seen).type("e").values().all())) {
      $seenIds.add(id)
    }

    return $seenIds
  })
})
