import {fromNostrURI, Kind, Tags} from "@welshman/util"
import {schnorr} from "@noble/curves/secp256k1"
import {bytesToHex} from "@noble/hashes/utils"
import {nip05, nip19, generateSecretKey, getEventHash, getPublicKey as getPk} from "nostr-tools"
import {identity} from "ramda"
import {avg} from "hurdak"
import {tryJson} from "src/util/misc"
import type {Event} from "src/engine"

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

export const noteKinds = [
  Kind.Note,
  Kind.LongFormArticle,
  Kind.Highlight,
  Kind.Remix,
  Kind.Audio,
  Kind.CalendarEventTime,
  Kind.ClassifiedListing,
]

export const replyKinds = [Kind.Note, Kind.Highlight, Kind.Remix, Kind.Audio]

export const reactionKinds = [Kind.Reaction, Kind.ZapResponse]
export const repostKinds = [Kind.Repost, Kind.GenericRepost]
export const giftWrapKinds = [Kind.GiftWrap, 1060]

export const personKinds = [
  Kind.Profile,
  Kind.Relay,
  Kind.ListFollows,
  Kind.UserListMutes,
  Kind.UserListRelays,
  Kind.UserListCommunities,
]

export const userKinds = [
  ...personKinds,
  Kind.Feed,
  Kind.ListGeneric,
  Kind.ListBookmarks,
  Kind.Application,
  Kind.UserListCommunities,
]

export const LOCAL_RELAY_URL = "local://coracle.relay"

export const appDataKeys = {
  USER_SETTINGS: "nostr-engine/User/settings/v1",
  NIP24_LAST_CHECKED: "nostr-engine/Nip24/last_checked/v1",
}

export const isLike = (e: Event) =>
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

export const getRating = (event: Event) => {
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

export const getAvgRating = (events: Event[]) => avg(events.map(getRating).filter(identity))

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
    return nip19.decode(entity)
  } catch (e) {
    return null
  }
}
