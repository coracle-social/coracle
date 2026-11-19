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
  DIRECT_MESSAGE_FILE,
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
  getPubkey,
  queryProfile,
} from "@welshman/util"
import {hexToBytes, bytesToHex, isHex32} from "@welshman/lib"
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

// Everything an event has to say about one of its urls: its dimensions, its mime type, and for an
// attachment to an encrypted message, the key it takes to read it.
export const getUrlTags = (url: string, event: TrustedEvent) => {
  const imetas = matchTags(tagSpec("imeta"), event.tags).map(imeta => tagsFromIMeta(imeta.slice(1)))
  const imeta = imetas.find(tags => tagValue(tagSpec("url"), tags) === url)

  if (imeta) {
    return imeta
  }

  // A nip-17 file message is about one file, and describes it on the event itself
  return event.kind === DIRECT_MESSAGE_FILE ? event.tags : []
}

export const makeZapSplit = (pubkey: string, relay = "", weight: string | number = "1") => [
  "zap",
  pubkey,
  relay,
  String(weight),
]

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

// External content ids (nip-73)

const externalContentUrls: [RegExp, (...match: string[]) => string][] = [
  [/^isbn:([\dx]+)$/i, id => `https://isbnsearch.org/isbn/${id}`],
  [/^doi:(.+)$/, id => `https://doi.org/${encodeURI(id)}`],
  [/^osm:(node|way|relation):(\d+)$/, (type, id) => `https://www.openstreetmap.org/${type}/${id}`],
  [/^podcast:guid:([-\w]+)$/, guid => `https://podcastindex.org/podcast/${guid}`],
  [/^isan:([-\w]+)$/, id => `https://web.isan.org/public/en/isan/${id}`],
  [/^bitcoin:(tx|address):(\w+)$/, (type, id) => `https://blockstream.info/${type}/${id}`],
]

const isHttpUrl = (url?: string) => Boolean(url?.match(/^https?:\/\/\S+$/i))

// A link for an `i` or `I` tag: the id itself if it's a web page, otherwise the url hint, falling
// back to a well-known site for kinds of ids that have one.
export const getExternalContentUrl = ([_, id = "", hint]: string[]) => {
  if (isHttpUrl(id)) return id
  if (isHttpUrl(hint)) return hint

  for (const [regexp, makeUrl] of externalContentUrls) {
    const match = id.match(regexp)

    if (match) {
      return makeUrl(...match.slice(1))
    }
  }
}

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")

// Swap any external content ids an event mentions in its content for their links, so they get
// rendered like any other link. Urls and hashtags are already rendered, so leave those alone.
export const linkExternalContent = (event: TrustedEvent) => {
  let content = event.content

  for (const tag of matchTags(tagSpec(["i", "I"]), event.tags)) {
    const id = tag[1]
    const url = getExternalContentUrl(tag)

    if (!id || !url || isHttpUrl(id) || id.startsWith("#")) continue

    const regexp = new RegExp(`(^|[\\s(])${escapeRegExp(id)}(?=$|[\\s),.!?;:])`, "g")

    content = content.replace(regexp, (_, prefix) => prefix + url)
  }

  return content
}
