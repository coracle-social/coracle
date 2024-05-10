import {nip19} from "nostr-tools"
import {sortBy} from "ramda"
import {fuzzy} from "src/util/misc"
import type {TrustedEvent} from "@welshman/util"
import {fromNostrURI, Tags, hasValidSignature} from "@welshman/util"
import {tryFunc, switcherFn} from "hurdak"
import {tryJson} from "src/util/misc"

export const sortEventsDesc = sortBy((e: TrustedEvent) => -e.created_at)

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

  const originalGroup = Tags.fromEvent(event).context().values().first()
  const repostGroup = Tags.fromEvent(repost).context().values().first()

  // Only show cross-posts, not reposts from global to global
  if (originalGroup === repostGroup) {
    return null
  }

  return event
}

export const kinds = [
  {kind: 0, label: "Profile data"},
  {kind: 3, label: "Contacts list"},
  {kind: 7, label: "Reaction"},
  {kind: 1, label: "Text note"},
  {kind: 1808, label: "Remix"},
  {kind: 32123, label: "Song"},
  {kind: 1985, label: "Label"},
  {kind: 1986, label: "Review"},
  {kind: 1063, label: "Image data"},
  {kind: 9735, label: "Reaction"},
  {kind: 9802, label: "Highlights"},
  {kind: 10002, label: "Relay selections"},
  {kind: 30023, label: "Long form content"},
  {kind: 31923, label: "Calendar Event"},
  {kind: 30402, label: "Classified Listing"},
]

export const searchKinds = fuzzy(kinds, {keys: ["kind", "label"]})
