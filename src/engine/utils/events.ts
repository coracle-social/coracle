import {nip19} from "nostr-tools"
import {tryFunc, switcherFn} from "hurdak"
import {sortBy} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {fromNostrURI, Address, hasValidSignature, Tags} from "@welshman/util"
import {parseJson} from "src/util/misc"

export const sortEventsAsc = events => sortBy((e: TrustedEvent) => e.created_at, events)

export const sortEventsDesc = events => sortBy((e: TrustedEvent) => -e.created_at, events)

export const decodeEvent = entity => {
  const annotateEvent = id => ({
    id,
    relays: [],
    note: tryFunc(() => nip19.noteEncode(id)),
    nevent: tryFunc(() => nip19.neventEncode({id, relays: []})),
  })

  entity = fromNostrURI(entity)

  let type, data
  try {
    ;({type, data} = nip19.decode(entity))
  } catch (e) {
    return annotateEvent(entity)
  }

  return switcherFn(type, {
    nevent: () => ({...data, note: nip19.noteEncode(data.id), nevent: nip19.neventEncode(data)}),
    naddr: () => ({...data, address: Address.fromNaddr(entity).toString()}),
    note: () => annotateEvent(data),
    default: () => annotateEvent(entity),
  })
}

export const unwrapRepost = repost => {
  const event = parseJson(repost.content)

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
