import type {DisplayEvent} from "src/util/types"
import {is, fromPairs, mergeLeft, last, identity, objOf, prop, flatten, uniq} from "ramda"
import {nip19} from "nostr-tools"
import {ensurePlural, ellipsize, first} from "hurdak/lib/hurdak"

export const personKinds = [0, 2, 3, 10001, 10002]
export const userKinds = personKinds.concat([10000])

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
  values() {
    return new Tags(this.tags.map(t => t[1]))
  }
  filter(f) {
    return new Tags(this.tags.filter(f))
  }
  type(type) {
    return new Tags(this.tags.filter(t => t[0] === type))
  }
  equals(value) {
    return new Tags(this.tags.filter(t => t[1] === value))
  }
  mark(mark) {
    return new Tags(this.tags.filter(t => last(t) === mark))
  }
}

// Support the deprecated version where tags are not marked as replies
export const findReply = e =>
  Tags.from(e).type("e").mark("reply").first() || Tags.from(e).type("e").last()

export const findReplyId = e =>
  Tags.wrap([findReply(e)])
    .values()
    .first()

export const findRoot = e => Tags.from(e).type("e").mark("root").first()

export const findRootId = e =>
  Tags.wrap([findRoot(e)])
    .values()
    .first()

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
  const text = content.trim()
  const result = []
  let buffer = "",
    i = 0

  const push = (type, text, value = null) => {
    if (buffer) {
      result.push({type: "text", value: buffer})
      buffer = ""
    }

    result.push({type, value: value || text})
    i += text.length
  }

  for (; i < text.length; ) {
    const prev = last(result)
    const tail = text.slice(i)

    const newLine = tail.match(/^\n+/)

    if (newLine) {
      push("newline", newLine[0])
      continue
    }

    // Convert legacy mentions to bech32 entities
    const mentionMatch = tail.match(/^#\[(\d+)\]/i)

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

        push(`nostr:${type}`, mentionMatch[0], {...data, entity})
        continue
      }
    }

    const topicMatch = tail.match(/^#\w+/i)

    if (topicMatch) {
      push("topic", topicMatch[0])
      continue
    }

    const bech32Match = tail.match(/^(nostr:)?n(event|ote|profile|pub)1[\d\w]+/i)

    if (bech32Match) {
      try {
        const entity = bech32Match[0].replace("nostr:", "")
        const {type, data} = nip19.decode(entity) as {type: string; data: object}

        push(`nostr:${type}`, bech32Match[0], {...data, entity})
        continue
      } catch (e) {
        console.log(e)
        // pass
      }
    }

    const urlMatch = tail.match(
      /^((http|ws)s?:\/\/)?[-a-z0-9:%_\+~#=\.]+\.[a-z]{1,6}[-a-z0-9:%_\+~#\?&\/=;\.]*/gi
    )

    // Skip url if it's just the end of a filepath
    if (urlMatch && (prev?.type !== "text" || !prev.value.endsWith("/"))) {
      let url = urlMatch[0]

      // Skip ellipses and very short non-urls
      if (!url.match(/\.\./) && url.length > 4) {
        // It's common for punctuation to end a url, trim it off
        if (url.match(/[\.\?,:]$/)) {
          url = url.slice(0, -1)
        }

        if (!url.match("://")) {
          url = "https://" + url
        }

        push("link", urlMatch[0], url)
        continue
      }
    }

    // Instead of going character by character and re-running all the above regular expressions
    // a million times, try to match the next word and add it to the buffer
    const wordMatch = tail.match(/^[\w\d]+ ?/i)

    if (wordMatch) {
      buffer += wordMatch[0]
      i += wordMatch[0].length
    } else {
      buffer += text[i]
      i += 1
    }
  }

  if (buffer) {
    result.push({type: "text", value: buffer})
  }

  return result
}
