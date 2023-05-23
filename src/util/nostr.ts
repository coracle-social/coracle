import type {DisplayEvent} from "src/util/types"
import {is, fromPairs, mergeLeft, last, identity, objOf, prop, flatten, uniq} from "ramda"
import {nip19} from "nostr-tools"
import {ensurePlural, ellipsize, first} from "hurdak/lib/hurdak"
import {tryJson} from "src/util/misc"
import {invoiceAmount} from "src/util/lightning"

export const personKinds = [0, 2, 3, 10001, 10002]
export const userKinds = personKinds.concat([10000, 30001, 30078])
export const appDataKeys = [
  "coracle/settings/v1",
  "coracle/last_checked/v1",
  "coracle/rooms_joined/v1",
]

export class Tags {
  tags: Array<any>
  constructor(tags) {
    this.tags = tags
  }
  static from(events) {
    return new Tags(ensurePlural(events).flatMap(prop("tags")))
  }
  static wrap(tags) {
    return new Tags((tags || []).filter(identity))
  }
  all() {
    return this.tags
  }
  count() {
    return this.tags.length
  }
  exists() {
    return this.tags.length > 0
  }
  first() {
    return first(this.tags)
  }
  nth(i) {
    return this.tags[i]
  }
  last() {
    return last(this.tags)
  }
  relays() {
    return uniq(flatten(this.tags).filter(isShareableRelay)).map(objOf("url"))
  }
  pubkeys() {
    return this.type("p").values().all()
  }
  asMeta() {
    return fromPairs(this.tags)
  }
  getMeta(k) {
    return this.type(k).values().first()
  }
  values() {
    return new Tags(this.tags.map(t => t[1]))
  }
  filter(f) {
    return new Tags(this.tags.filter(f))
  }
  any(f) {
    return this.filter(f).exists()
  }
  type(type) {
    const types = ensurePlural(type)

    return new Tags(this.tags.filter(t => types.includes(t[0])))
  }
  equals(value) {
    return new Tags(this.tags.filter(t => t[1] === value))
  }
  mark(mark) {
    return new Tags(this.tags.filter(t => last(t) === mark))
  }
}

export const findReplyAndRoot = e => {
  const tags = Tags.from(e).type("e")
  const legacy = tags.any(t => !["reply", "root"].includes(last(t)))

  // Support the deprecated version where tags are not marked as replies
  if (legacy) {
    const reply = tags.last()
    const root = tags.count() > 1 ? tags.first() : null

    return {reply, root}
  }

  const reply = tags.mark("reply").first()
  const root = tags.mark("root").first()

  return {reply: reply || root, root}
}

export const findReply = e => prop("reply", findReplyAndRoot(e))

export const findReplyId = e => findReply(e)?.[1]

export const findRoot = e => prop("root", findReplyAndRoot(e))

export const findRootId = e => findRoot(e)?.[1]

export const displayPerson = p => {
  if (p.kind0?.display_name) {
    return ellipsize(p.kind0?.display_name, 60)
  }

  if (p.kind0?.name) {
    return ellipsize(p.kind0?.name, 60)
  }

  try {
    return nip19.npubEncode(p.pubkey).slice(-8)
  } catch (e) {
    console.error(e)

    return ""
  }
}

export const displayRelay = ({url}) => last(url.split("://"))

export const isLike = content => ["", "+", "🤙", "👍", "❤️", "😎", "🏅"].includes(content)

export const isNotification = (e, pubkey) => {
  if (![1, 7, 9735].includes(e.kind)) {
    return false
  }

  // Don't show people's own stuff
  if (e.pubkey === pubkey) {
    return false
  }

  // Only notify users about positive reactions
  if (e.kind === 7 && !isLike(e.content)) {
    return false
  }

  return true
}

export const isRelay = url =>
  typeof url === "string" &&
  // It should have the protocol included
  url.match(/^wss:\/\/.+/)

export const isShareableRelay = url =>
  isRelay(url) &&
  // Don't match stuff with a port number
  !url.slice(6).match(/:\d+/) &&
  // Don't match raw ip addresses
  !url.slice(6).match(/\d+\.\d+\.\d+\.\d+/) &&
  // Skip nostr.wine's virtual relays
  !url.slice(6).match(/\/npub/)

export const normalizeRelayUrl = url => url.replace(/\/+$/, "").toLowerCase().trim()

export const roomAttrs = ["name", "about", "picture"]

export const asDisplayEvent = event =>
  ({replies: [], reactions: [], zaps: [], ...event} as DisplayEvent)

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

export const mergeFilter = (filter, extra) =>
  is(Array, filter) ? filter.map(mergeLeft(extra)) : {...filter, ...extra}

export const parseContent = ({content, tags = []}) => {
  const result = []
  let text = content.trim()
  let buffer = ""

  const parseNewline = () => {
    const newline = first(text.match(/^\n+/))

    if (newline) {
      return ["newline", newline, newline]
    }
  }

  const parseMention = () => {
    // Convert legacy mentions to bech32 entities
    const mentionMatch = text.match(/^#\[(\d+)\]/i)

    if (mentionMatch) {
      const i = parseInt(mentionMatch[1])

      if (tags[i]) {
        const [tag, value, url] = tags[i]
        const relays = [url].filter(identity)

        let type, data, entity
        if (tag === "p") {
          type = "nprofile"
          data = {pubkey: value, relays}
          entity = nip19.nprofileEncode(data)
        } else {
          type = "nevent"
          data = {id: value, relays, pubkey: null}
          entity = nip19.neventEncode(data)
        }

        return [`nostr:${type}`, mentionMatch[0], {...data, entity}]
      }
    }
  }

  const parseTopic = () => {
    const topic = first(text.match(/^#\w+/i))

    // Skip numeric topics
    if (topic && !topic.match(/^#\d+$/)) {
      return ["topic", topic, topic.slice(1)]
    }
  }

  const parseBech32 = () => {
    const bech32 = first(
      text.match(/^(web\+)?(nostr:)?\/?\/?n(event|ote|profile|pub|addr)1[\d\w]+/i)
    )

    if (bech32) {
      try {
        const entity = fromNostrURI(bech32)
        const {type, data} = nip19.decode(entity) as {type: string; data: object}

        let value = data
        if (type === "note") {
          value = {id: data}
        } else if (type === "npub") {
          value = {pubkey: data}
        }

        return [`nostr:${type}`, bech32, {...value, entity}]
      } catch (e) {
        console.log(e)
        // pass
      }
    }
  }

  const parseUrl = () => {
    const raw = first(
      text.match(
        /^((http|ws)s?:\/\/)?[-a-z0-9:%_\+~#=\.\*]+\.[a-z]{1,6}[-a-z0-9:%_\+~#\?&\/=;\.\*]*/gi
      )
    )

    // Skip url if it's just the end of a filepath
    if (raw) {
      const prev = last(result)

      if (prev?.type === "text" && prev.value.endsWith("/")) {
        return
      }

      let url = raw

      // Skip ellipses and very short non-urls
      if (!url.match(/\.\./) && url.length > 4) {
        // It's common for punctuation to end a url, trim it off
        if (url.match(/[\.\?,:]$/)) {
          url = url.slice(0, -1)
        }

        if (!url.match("://")) {
          url = "https://" + url
        }

        return ["link", raw, url]
      }
    }
  }

  while (text) {
    const part = parseNewline() || parseMention() || parseTopic() || parseBech32() || parseUrl()

    if (part) {
      if (buffer) {
        result.push({type: "text", value: buffer})
        buffer = ""
      }

      const [type, raw, value] = part

      result.push({type, value})
      text = text.slice(raw.length)
    } else {
      // Instead of going character by character and re-running all the above regular expressions
      // a million times, try to match the next word and add it to the buffer
      const match = first(text.match(/^[\w\d]+ ?/i)) || text[0]

      buffer += match
      text = text.slice(match.length)
    }
  }

  if (buffer) {
    result.push({type: "text", value: buffer})
  }

  return result
}

export const processZaps = (zaps, author) =>
  zaps
    .map(zap => {
      const zapMeta = Tags.from(zap).asMeta()

      return tryJson(() => ({
        ...zap,
        invoiceAmount: invoiceAmount(zapMeta.bolt11),
        request: JSON.parse(zapMeta.description),
      }))
    })
    .filter(zap => {
      if (!zap) {
        return false
      }

      // Don't count zaps that the user sent himself
      if (zap.request.pubkey === author.pubkey) {
        return false
      }

      const {invoiceAmount, request} = zap
      const reqMeta = Tags.from(request).asMeta()

      // Verify that the zapper actually sent the requested amount (if it was supplied)
      if (reqMeta.amount && parseInt(reqMeta.amount) !== invoiceAmount) {
        return false
      }

      // If the sending client provided an lnurl tag, verify that too
      if (reqMeta.lnurl && reqMeta.lnurl !== author.lnurl) {
        return false
      }

      // Verify that the zap note actually came from the recipient's zapper
      if (author.zapper?.nostrPubkey !== zap.pubkey) {
        return false
      }

      return true
    })

export const fromNostrURI = s => s.replace(/^[\w\+]+:\/?\/?/, "")

export const toNostrURI = s => `web+nostr://${s}`
