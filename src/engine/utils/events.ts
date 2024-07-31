import {nip19} from "nostr-tools"
import {tryFunc, switcherFn} from "hurdak"
import {sortBy} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {fromNostrURI, hasValidSignature, Tags} from "@welshman/util"
import {tryJson} from "src/util/misc"

export const sortEventsAsc = events => sortBy((e: TrustedEvent) => e.created_at, events)

export const sortEventsDesc = events => sortBy((e: TrustedEvent) => -e.created_at, events)

export const decodeEvent = entity => {
  const annotateEvent = eid => ({
    eid,
    relays: [],
    note: tryFunc(() => nip19.noteEncode(eid)),
    nevent: tryFunc(() => nip19.neventEncode({id: eid, relays: []})),
  })

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

  const originalGroup = Tags.fromEvent(event).context().values().first()
  const repostGroup = Tags.fromEvent(repost).context().values().first()

  // Only show cross-posts, not reposts from global to global
  if (originalGroup === repostGroup) {
    return null
  }

  return event
}
