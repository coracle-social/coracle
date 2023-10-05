import {nip19} from "nostr-tools"
import {sortBy} from "ramda"
import {switcherFn} from "hurdak"
import {fromNostrURI} from "src/util/nostr"
import type {Event} from "./model"

export const sortEventsDesc = sortBy((e: Event) => -e.created_at)

const annotateEvent = eid => ({
  eid,
  relays: [],
  note: nip19.noteEncode(eid),
  nevent: nip19.neventEncode({id: eid, relays: []}),
})

export const decodeEvent = entity => {
  entity = fromNostrURI(entity)

  let type, data
  try {
    ;({type, data} = nip19.decode(entity))
  } catch (e) {
    return annotateEvent(entity)
  }

  return switcherFn(type, {
    nevent: () => ({
      eid: data.id,
      relays: data.relays,
      note: nip19.noteEncode(data.id),
      nevent: nip19.neventEncode(data),
    }),
    note: () => annotateEvent(data),
    default: () => annotateEvent(entity),
  })
}
