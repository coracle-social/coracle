import {nip19} from "nostr-tools"
import {sortBy} from "ramda"
import {fromNostrURI, Tags} from "paravel"
import {tryFunc, switcherFn} from "hurdak"
import {Naddr} from "src/util/nostr"
import {getEventHints} from "src/engine/relays/utils"
import type {Event} from "./model"

export const sortEventsDesc = sortBy((e: Event) => -e.created_at)

export const isReplaceable = e => e.kind >= 10000

export const getIds = (e: Event) => {
  const ids = [e.id]

  if (isReplaceable(e)) {
    ids.push(Naddr.fromEvent(e, getEventHints(e)).asTagValue())
  }

  return ids
}

export const isChildOf = (a, b) => getIds(b).includes(Tags.from(a).getReply())

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
