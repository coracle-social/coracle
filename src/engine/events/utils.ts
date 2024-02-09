import {nip19} from "nostr-tools"
import {sortBy} from "ramda"
import {fromNostrURI, Tags, hasValidSignature} from "paravel"
import {tryFunc, switcherFn} from "hurdak"
import {tryJson} from "src/util/misc"
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

export const unwrapRepost = repost => {
  const event = tryJson(() => JSON.parse(repost.content))

  try {
    if (!event || !hasValidSignature(event)) {
      return null
    }
  } catch (e) {
    return null
  }

  const originalGroup = Tags.from(event).circles().first()
  const repostGroup = Tags.from(repost).circles().first()

  // Only show cross-posts, not reposts from global to global
  if (originalGroup === repostGroup) {
    return null
  }

  return event
}
