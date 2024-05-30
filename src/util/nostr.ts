import {
  fromNostrURI,
  APP_DATA,
  AUDIO,
  CLASSIFIED,
  EVENT_TIME,
  FEED,
  GENERIC_REPOST,
  NAMED_BOOKMARKS,
  HANDLER_INFORMATION,
  HIGHLIGHT,
  LONG_FORM,
  NOTE,
  PROFILE,
  REACTION,
  REMIX,
  REPOST,
  WRAP,
  WRAP_NIP04,
  ZAP_RESPONSE,
  Tags,
  Address,
  isShareableRelayUrl,
} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {schnorr} from "@noble/curves/secp256k1"
import {bytesToHex} from "@noble/hashes/utils"
import {nip05, nip19, generateSecretKey, getEventHash, getPublicKey as getPk} from "nostr-tools"
import {identity} from "ramda"
import {avg} from "hurdak"
import {tryJson} from "src/util/misc"
import {LIST_KINDS} from "src/domain"

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

export const noteKinds = [NOTE, LONG_FORM, HIGHLIGHT, REMIX, AUDIO, EVENT_TIME, CLASSIFIED]
export const replyKinds = [NOTE, HIGHLIGHT, REMIX, AUDIO]
export const reactionKinds = [REACTION, ZAP_RESPONSE] as number[]
export const repostKinds = [REPOST, GENERIC_REPOST] as number[]
export const giftWrapKinds = [WRAP, WRAP_NIP04] as number[]
export const personKinds = [
  ...LIST_KINDS,
  HANDLER_INFORMATION,
  NAMED_BOOKMARKS,
  FEED,
  PROFILE,
] as number[]
export const userKinds = [...personKinds, APP_DATA] as number[]

export const appDataKeys = {
  USER_SETTINGS: "nostr-engine/User/settings/v1",
  NIP24_LAST_CHECKED: "nostr-engine/Nip24/last_checked/v1",
}

export const isLike = (e: TrustedEvent) =>
  e.kind === 7 &&
  ["", "+", "🤙", "👍", "❤️", "😎", "🏅", "🫂", "🤣", "😂", "💜", "🔥"].includes(e.content)

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

export const getRating = (event: TrustedEvent) => {
  if (event.kind === 1985) {
    return tryJson(() => {
      const json = JSON.parse(
        Tags.fromEvent(event).whereKey("l").whereValue("review/relay").first()?.last(),
      )

      return json?.quality
    })
  } else {
    return parseInt(
      Tags.fromEvent(event)
        .whereKey("rating")
        .filter(t => t.count() === 2)
        .first()
        ?.value(),
    )
  }
}

export const getAvgRating = (events: TrustedEvent[]) => avg(events.map(getRating).filter(identity))

export const isHex = x => x?.length === 64 && x?.match(/^[a-f0-9]{64}$/)

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
  const tags = Tags.fromEvent(e)
  const warning = tags.get("content-warning")?.value()

  if (warning) {
    return warning
  }

  return tags.topics().find(t => WARN_TAGS.has(t.toLowerCase()))
}

export const isGiftWrap = e => giftWrapKinds.includes(e.kind)

export const parseAnything = async entity => {
  if (entity.includes("@")) {
    const profile = await nip05.queryProfile(entity)

    if (profile) {
      return {type: "npub", data: profile.pubkey}
    }
  }

  return parseAnythingSync(entity)
}

export const parseAnythingSync = entity => {
  entity = fromNostrURI(entity)

  // Interpret addresses as naddrs
  if (Address.isAddress(entity)) {
    entity = Address.from(entity).toNaddr()
  }

  if (isHex(entity)) {
    return {type: "npub", data: entity}
  }

  try {
    return nip19.decode(entity)
  } catch (e) {
    return null
  }
}

export const getTags =
  (types: string[], testValue = null) =>
  (tags: string[][]) =>
    tags.filter(t => types.includes(t[0]) && (!testValue || testValue(t[1] || "")))

export const getTagValues = (types: string[], testValue = null) => {
  const _getTags = getTags(types, testValue)

  return (tags: string[][]) => _getTags(tags).map(t => t[1] || "")
}

export const getAddressTags = getTags(["a"], Address.isAddress)

export const getAddressTagValues = getTagValues(["a"], Address.isAddress)

export const getPubkeyTags = getTags(["p"], pk => pk.length === 64)

export const getPubkeyTagValues = getTagValues(["p"], pk => pk.length === 64)

export const getRelayTags = getTags(["r", "relay"], isShareableRelayUrl)

export const getRelayTagValues = getTagValues(["r", "relay"], isShareableRelayUrl)
