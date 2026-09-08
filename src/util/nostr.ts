import {avg, last, nthEq} from "@welshman/lib"
import {
  fromNostrURI,
  GENERIC_REPOST,
  HIGHLIGHT,
  PICTURE_NOTE,
  LONG_FORM,
  NOTE,
  COMMENT,
  POLL,
  REACTION,
  REPOST,
  ZAP_RECEIPT,
  Address,
  MUTES,
  matchTags,
  tagSpec,
  tagValue,
  tagValues,
  topicTags,
  ROOMS,
  FEED,
  NAMED_PEOPLE,
  NAMED_RELAYS,
  NAMED_CURATIONS,
  NAMED_WIKI_AUTHORS,
  NAMED_WIKI_RELAYS,
  NAMED_EMOJIS,
  NAMED_TOPICS,
  NAMED_ARTIFACTS,
  NAMED_COMMUNITIES,
  PINS,
  BOOKMARKS,
  COMMUNITIES,
  CHANNELS,
  TOPICS,
  LABEL,
  getPubkey,
  queryProfile,
} from "@welshman/util"
import {identity, hexToBytes, bytesToHex, isHex32, parseJson} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import type {ProfileReader} from "@welshman/domain"
import * as nip19 from "nostr-tools/nip19"

export const nsecEncode = secret => nip19.nsecEncode(hexToBytes(secret))

export const nsecDecode = (nsec: string) => {
  const {type, data} = nip19.decode(nsec)

  if (type !== "nsec") throw new Error(`Invalid nsec: ${nsec}`)

  return bytesToHex(data)
}

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

export const profileHasName = (profile?: ProfileReader) =>
  Boolean(profile?.name() || profile?.values.display_name)

export const RELAY_FEEDS = 10012

export const replyKinds = [NOTE, COMMENT]
export const noteKinds = [...replyKinds, PICTURE_NOTE, LONG_FORM, HIGHLIGHT, POLL]
export const reactionKinds = [REACTION, ZAP_RECEIPT] as number[]
export const repostKinds = [REPOST, GENERIC_REPOST] as number[]
export const headerlessKinds = [
  ROOMS,
  FEED,
  NAMED_PEOPLE,
  NAMED_RELAYS,
  NAMED_CURATIONS,
  NAMED_WIKI_AUTHORS,
  NAMED_WIKI_RELAYS,
  NAMED_EMOJIS,
  NAMED_TOPICS,
  NAMED_ARTIFACTS,
  NAMED_COMMUNITIES,
  MUTES,
  PINS,
  BOOKMARKS,
  COMMUNITIES,
  CHANNELS,
  TOPICS,
]

export const appDataKeys = {
  USER_SETTINGS: "nostr-engine/User/settings/v1",
}

export const nip46Perms = "sign_event:22242,nip04_encrypt,nip04_decrypt,nip44_encrypt,nip44_decrypt"

export const tagsFromIMeta = (imeta: string[]) => imeta.map(m => m.split(" "))

export const makeZapSplit = (pubkey: string, relay = "", weight: string | number = "1") => [
  "zap",
  pubkey,
  relay,
  String(weight),
]

export const getRating = (event: TrustedEvent) =>
  event.kind === LABEL
    ? parseJson(last(matchTags(tagSpec("l"), event.tags).find(nthEq(1, "review/relay")) || []))
        ?.quality
    : parseFloat(matchTags(tagSpec("rating"), event.tags).find(t => t.length === 2)?.[1])

export const getAvgRating = (events: TrustedEvent[]) => avg(events.map(getRating).filter(identity))

const BAD_DOMAINS = ["libfans.com", "matrix.org/_matrix/media/v3/download"]

const getBadDomainsWarning = (e: TrustedEvent) => {
  for (const domain of BAD_DOMAINS) {
    if (e.content.includes(domain)) {
      return "This note includes media from untrusted hosts."
    }

    for (const tag of e.tags) {
      if (tag.some(t => t?.includes(domain))) {
        return "This note includes media from untrusted hosts."
      }
    }
  }
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

export const getContentWarning = (e: TrustedEvent) =>
  getBadDomainsWarning(e) ||
  tagValue(tagSpec("content-warning"), e.tags) ||
  tagValues(topicTags("t"), e.tags).find(t => WARN_TAGS.has(t.toLowerCase()))

export const parseAnything = async entity => {
  if (entity.includes("@")) {
    const handle = await queryProfile(entity)

    if (handle?.pubkey) {
      return {type: "npub", data: handle.pubkey}
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

  if (isHex32(entity)) {
    return {type: "npub", data: entity}
  }

  try {
    return nip19.decode(entity)
  } catch (e) {
    return null
  }
}
