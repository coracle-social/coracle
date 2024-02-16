import {fromNostrURI, Tags} from "paravel"
import {schnorr} from "@noble/curves/secp256k1"
import {bytesToHex} from "@noble/hashes/utils"
import {nip05, nip19, generateSecretKey, getEventHash, getPublicKey as getPk} from "nostr-tools"
import {pick, reject, is, join, mergeLeft, identity} from "ramda"
import {between, avg} from "hurdak"
import logger from "src/util/logger"
import {ninviteDecode} from "src/util/invite"
import type {Filter, Event} from "src/engine"

export const fromHex = k => Uint8Array.from(Buffer.from(k, "hex"))
export const getPublicKey = (sk: string) => getPk(fromHex(sk))
export const generatePrivateKey = () => Buffer.from(generateSecretKey()).toString("hex")
export const getSignature = (e, sk: string) => bytesToHex(schnorr.sign(getEventHash(e), sk))
export const nsecEncode = (sk: string) => nip19.nsecEncode(Uint8Array.from(Buffer.from(sk, "hex")))

export const isKeyValid = (key: string) => {
  // Validate the key before setting it to state by encoding it using bech32.
  // This will error if invalid (this works whether it's a public or a private key)
  try {
    getPublicKey(key)
  } catch (e) {
    return false
  }

  return true
}

export const noteKinds = [1, 30023, 9802, 1808, 32123, 31923, 30402]
export const personKinds = [0, 2, 3, 10000, 10002]
export const reactionKinds = [7, 9735]
export const repostKinds = [6, 16]
export const userKinds = [...personKinds, 30001, 30003, 30078, 10004]

export const LOCAL_RELAY_URL = "local://coracle.relay"

export const appDataKeys = {
  USER_SETTINGS: "nostr-engine/User/settings/v1",
  NIP24_LAST_CHECKED: "nostr-engine/Nip24/last_checked/v1",
}

export const isLike = (e: Event) =>
  e.kind === 7 &&
  ["", "+", "🤙", "👍", "❤️", "😎", "🏅", "🫂", "🤣", "😂", "💜", "🔥"].includes(e.content)

export const channelAttrs = ["name", "about", "picture"]
export const groupAttrs = ["name", "about", "picture"]

export const asNostrEvent = e =>
  pick(["content", "created_at", "id", "kind", "pubkey", "sig", "tags"], e) as Event

export const toHex = (data: string): string | null => {
  if (data.match(/[a-zA-Z0-9]{64}/)) {
    return data
  }

  try {
    let key = nip19.decode(data).data

    if (key instanceof Uint8Array) {
      key = Buffer.from(key).toString("hex")
    }

    return key as string
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
      .first(),
  )

export const getAvgRating = (events: Event[]) => avg(events.map(getRating).filter(identity))

export const isHex = x => x.match(/^[a-f0-9]{64}$/)

export const getParentId = (e, type = null) => {
  const {roots, replies} = Tags.from(e).getAncestors()

  if (type) {
    return replies.type(type).values().first() || roots.type(type).values().first()
  }

  return (
    replies.type("e").values().first() ||
    replies.type("a").values().first() ||
    roots.type("e").values().first() ||
    roots.type("a").values().first()
  )
}

export const getParentIds = e => {
  const {roots, replies} = Tags.from(e).getAncestors()
  const tags = replies.exists() ? replies : roots

  return tags.values().all()
}

export const getRootId = (e, type = null) => {
  const {roots} = Tags.from(e).getAncestors()

  if (type) {
    return roots.type(type).values().first()
  }

  return roots.type("e").values().first() || roots.type("a").values().first()
}

export const getRootIds = e => Tags.from(e).roots().values().all()

export const isReplaceable = e => between(9999, 20000, e.kind)

export const isParameterizedReplaceable = e => between(29999, 40000, e.kind)

export const isAddressable = e => isReplaceable(e) || isParameterizedReplaceable(e)

export const getIdOrAddress = e => (isAddressable(e) ? Naddr.fromEvent(e).asTagValue() : e.id)

export const getIdAndAddress = e =>
  isAddressable(e) ? [e.id, Naddr.fromEvent(e).asTagValue()] : [e.id]

export const getIdOrAddressTag = (e, hint) => {
  const value = getIdOrAddress(e)
  const type = value.includes(":") ? "a" : "e"

  return [type, value, hint]
}

export const isChildOf = (a, b) => {
  const {roots, replies} = Tags.from(a).getAncestors()
  const parentIds = (replies.exists() ? replies : roots).values().all()

  return Boolean(getIdAndAddress(b).find(x => parentIds.includes(x)))
}

export class Naddr {
  constructor(
    readonly kind,
    readonly pubkey,
    readonly identifier,
    readonly relays,
  ) {
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
    let type
    let data = {} as any
    try {
      ;({type, data} = nip19.decode(naddr) as {
        type: "naddr"
        data: any
      })
    } catch (e) {
      // pass
    }

    if (type !== "naddr") {
      logger.warn(`Invalid naddr ${naddr}`)
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

export const isGiftWrap = e => [1059, 1060].includes(e.kind)

export class EventBuilder {
  template: {
    kind?: number
    pubkey?: string
    created_at?: number
    content?: string
    tags?: string[][]
  } = {}

  static from(event) {
    const builder = new EventBuilder()

    builder.setKind(event.kind)
    builder.setPubkey(event.pubkey)
    builder.setCreatedAt(event.created_at)
    builder.setContent(event.content)
    builder.setTags(event.tags)

    return builder
  }

  setKind(kind: number) {
    this.template.kind = kind
  }

  setPubkey(pubkey: string) {
    this.template.pubkey = pubkey
  }

  setCreatedAt(createdAt: number) {
    this.template.created_at = createdAt
  }

  setContent(content: string) {
    this.template.content = content
  }

  setTags(tags: string[][]) {
    this.template.tags = tags
  }

  removeTag(k: string) {
    this.template.tags = this.template.tags.filter(t => t[0] !== k)
  }

  addTag(k: string, v: string, ...extra: string[]) {
    this.template.tags = this.template.tags.concat([[k, v, ...extra]])
  }

  setTagArgs(k: string, ...args: string[]) {
    this.template.tags = this.template.tags.map(t => {
      if (t[0] === k) {
        t = [t[0], ...args, ...t.slice(args.length + 1)]
      }

      return t
    })
  }

  removeImages() {
    this.template.tags = reject(t => t[0] === "image", this.template.tags)
  }

  addImages(imeta: Array<typeof Tags>) {
    for (const tags of imeta) {
      this.template.tags.push(["image", tags.type("url").values().first()])
    }
  }

  setImages(imeta: Array<typeof Tags>) {
    this.removeImages()
    this.addImages(imeta)
  }

  removeImageMeta() {
    this.template.tags = reject(t => t[0] === "imeta", this.template.tags)
  }

  addImageMeta(imeta: Array<typeof Tags>) {
    for (const tags of imeta) {
      this.template.tags.push(["imeta", ...tags.all().map(join(" "))])
    }
  }

  setImageMeta(imeta: Array<typeof Tags>) {
    this.removeImageMeta()
    this.addImageMeta(imeta)
  }

  removeCircles() {
    this.template.tags = reject(
      t => t[0] === "a" && t[1].match(/^(34550|35834):/),
      this.template.tags,
    )
  }
}

export const parseAnything = async entity => {
  entity = fromNostrURI(entity)

  if (isHex(entity)) {
    return {type: "npub", data: entity}
  }

  if (entity.includes("@")) {
    const profile = await nip05.queryProfile(entity)

    if (profile) {
      return {type: "npub", data: profile.pubkey}
    }
  }

  try {
    if (entity.startsWith("ninvite1")) {
      return ninviteDecode(entity)
    }

    return nip19.decode(entity)
  } catch (e) {
    // Pass
  }
}
