import {last, nthEq} from "@welshman/lib"
import {
  fromNostrURI,
  GENERIC_REPOST,
  HIGHLIGHT,
  LONG_FORM,
  NOTE,
  REACTION,
  REPOST,
  ZAP_RESPONSE,
  Address,
  RELAYS,
  PROFILE,
  INBOX_RELAYS,
  FOLLOWS,
  MUTES,
  getTags,
  getTagValue,
  getTopicTagValues,
} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {getPubkey} from "@welshman/signer"
import {hexToBytes} from "@noble/hashes/utils"
import {nip05, nip19} from "nostr-tools"
import {identity} from "ramda"
import {avg} from "hurdak"
import {parseJson} from "src/util/misc"

export const nsecEncode = secret => nip19.nsecEncode(hexToBytes(secret))

export const isKeyValid = (key: string) => {
  // Validate the key before setting it to state by encoding it using bech32.
  // This will error if invalid (this works whether it's a public or a private key)
  try {
    getPubkey(key)
  } catch (e) {
    return false
  }

  return true
}

export const noteKinds = [NOTE, LONG_FORM, HIGHLIGHT]
export const reactionKinds = [REACTION, ZAP_RESPONSE] as number[]
export const repostKinds = [REPOST, GENERIC_REPOST] as number[]
export const metaKinds = [PROFILE, FOLLOWS, MUTES, RELAYS, INBOX_RELAYS] as number[]

export const appDataKeys = {
  USER_SETTINGS: "nostr-engine/User/settings/v1",
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

export const getRating = (event: TrustedEvent) =>
  event.kind === 1985
    ? parseJson(last(getTags("l", event.tags).find(nthEq(1, "review/relay")) || []))?.quality
    : parseInt(getTags("rating", event.tags).find(t => t.length === 2)?.[1])

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

export const getContentWarning = e =>
  getTagValue("content-warning", e.tags) ||
  getTopicTagValues(e.tags).some(t => WARN_TAGS.has(t.toLowerCase()))

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

export const parsePubkey = async entity => {
  const result = await parseAnything(entity)

  if (result.type === "npub") return result.data
  if (result.type === "nprofile") return result.data.pubkey
}
