import {nip19} from "nostr-tools"
import {sortBy} from "ramda"
import {fromNostrURI} from "paravel"
import {tryFunc, switcherFn} from "hurdak"
import type {Event} from "./model"

export const sortEventsDesc = sortBy((e: Event) => -e.created_at)

const annotateEvent = eid => ({
  eid,
  relays: [],
  note: tryFunc(() => nip19.noteEncode(eid)),
  nevent: tryFunc(() => nip19.neventEncode({id: eid, relays: []})),
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
    naddr: () => ({
      kind: data.kind,
      pubkey: data.pubkey,
      identifier: data.identifier,
      relays: data.relays,
    }),
    note: () => annotateEvent(data),
    default: () => annotateEvent(entity),
  })
}
