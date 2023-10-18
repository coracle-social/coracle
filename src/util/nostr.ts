import {Tags} from "paravel"
import {nip19} from "nostr-tools"
import {pick, is, mergeLeft, identity} from "ramda"
import {between, avg} from "hurdak"
import type {Filter, Event} from "src/engine"

export const noteKinds = [1, 30023, 1063, 9802, 1808, 32123]
export const personKinds = [0, 2, 3, 10000, 10002]
export const reactionKinds = [7, 9735]
export const userKinds = [...personKinds, 30001, 30003, 30078, 10004]

export const LOCAL_RELAY_URL = "local://coracle.relay"

export const appDataKeys = {
  USER_SETTINGS: "nostr-engine/User/settings/v1",
  NIP04_LAST_CHECKED: "nostr-engine/Nip04/last_checked/v1",
  NIP24_LAST_CHECKED: "nostr-engine/Nip24/last_checked/v1",
}

export const isLike = (content: string) =>
  ["", "+", "🤙", "👍", "❤️", "😎", "🏅", "🫂", "🤣", "😂", "💜"].includes(content)

export const channelAttrs = ["name", "about", "picture"]
export const groupAttrs = ["name", "about", "picture"]

export const asNostrEvent = e =>
  pick(["content", "created_at", "id", "kind", "pubkey", "sig", "tags"], e) as Event

export const toHex = (data: string): string | null => {
  if (data.match(/[a-zA-Z0-9]{64}/)) {
    return data
  }

  try {
    return nip19.decode(data).data as string
  } catch (e) {
    return null
  }
}

export const mergeFilter = (filter: Filter | Filter[], extra: Filter) =>
  is(Array, filter) ? filter.map(mergeLeft(extra)) : {...filter, ...extra}

export const getRating = (event: Event) =>
  parseInt(
    Tags.from(event)
      .type("rating")
      .filter(t => t.length === 2)
      .pluck(1)
      .first()
  )

export const getAvgRating = (events: Event[]) => avg(events.map(getRating).filter(identity))

export const isHex = x => x.match(/^[a-f0-9]{64}$/)

export const getIdOrAddress = e => {
  if (between(9999, 20000, e.kind) || between(39999, 40000, e.kind)) {
    return Naddr.fromEvent(e).asTagValue()
  }

  return e.id
}

export const getGroupAddress = e =>
  Tags.from(e)
    .type("a")
    .values()
    .find(a => a.startsWith("34550:"))

export class Naddr {
  constructor(readonly kind, readonly pubkey, readonly identifier, readonly relays) {
    this.kind = parseInt(kind)
    this.identifier = identifier || ""
  }

  static fromEvent = (e: Event, relays = []) =>
    new Naddr(e.kind, e.pubkey, Tags.from(e).getValue("d"), relays)

  static fromTagValue = (a, relays = []) => {
    const [kind, pubkey, identifier] = a.split(":")

    return new Naddr(kind, pubkey, identifier, relays)
  }

  static fromTag = (tag, relays = []) => {
    const [a, hint] = tag.slice(1)

    return this.fromTagValue(a, relays.concat(hint ? [hint] : []))
  }

  static decode = naddr => {
    let type,
      data = {}
    try {
      ;({type, data} = nip19.decode(naddr) as {
        type: "naddr"
        data: AddressPointer
      })
    } catch (e) {}

    if (type !== "naddr") {
      console.warn(`Invalid naddr ${naddr}`)
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

const WARN_TAGS = new Set([
  "nsfw",
  "nude",
  "nudity",
  "porn",
  "ass",
  "boob",
  "boobstr",
  "sex",
  "sexy",
  "fuck",
])

export const getContentWarning = e => {
  const tags = Tags.from(e)
  const warning = tags.type("content-warning").values().first()

  if (warning) {
    return warning
  }

  return tags.topics().find(t => WARN_TAGS.has(t.toLowerCase()))
}
