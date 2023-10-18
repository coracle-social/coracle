import type {AddressPointer} from "nostr-tools/lib/nip19"
import {nip19} from "nostr-tools"
import {sortBy} from "ramda"
import {switcherFn} from "hurdak"
import {fromNostrURI, findReplyId, Tags} from "src/util/nostr"
import {getEventHints} from "src/engine/relays/utils"
import type {Event} from "./model"

export const sortEventsDesc = sortBy((e: Event) => -e.created_at)

export const isReplaceable = e => e.kind >= 10000

export const getIds = (e: Event) => {
  const ids = [e.id]

  if (isReplaceable(e)) {
    ids.push(Naddr.fromEvent(e).asTagValue())
  }

  return ids
}

export const isChildOf = (a, b) => getIds(b).includes(findReplyId(a))

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

export class Naddr {
  constructor(readonly kind, readonly pubkey, readonly identifier, readonly relays) {
    this.kind = parseInt(kind)
    this.identifier = identifier || ""
  }

  static fromEvent = (e: Event) =>
    new Naddr(e.kind, e.pubkey, Tags.from(e).getMeta("d"), getEventHints(e))

  static fromTagValue = (a, relays = []) => {
    const [kind, pubkey, identifier] = a.split(":")

    return new Naddr(kind, pubkey, identifier, relays)
  }

  static fromTag = tag => {
    const [a, hint] = tag.slice(1)
    const relays = hint ? [hint] : []

    return this.fromTagValue(a, relays)
  }

  static decode = naddr => {
    const {type, data} = nip19.decode(naddr) as {
      type: "naddr"
      data: AddressPointer
    }

    if (type !== "naddr") {
      throw new Error(`Invalid naddr ${naddr}`)
    }

    return new Naddr(data.kind, data.pubkey, data.identifier, data.relays)
  }

  asTagValue = () => [this.kind, this.pubkey, this.identifier].join(":")

  asTag = (mark = null) => {
    const tag = ["a", this.asTagValue(), this.relays[0] || ""]

    if (mark) {
      tag.push(mark)
    }

    return tag
  }

  asFilter = () => ({
    kinds: [this.kind],
    authors: [this.pubkey],
    "#d": [this.identifier],
  })

  encode = () => nip19.naddrEncode(this)
}
