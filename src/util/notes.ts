import {last, drop, pipe, map, pluck, identity} from "ramda"
import {fromNostrURI, Tags} from "paravel"
import {nip19} from "nostr-tools"
import {first, switcherFn} from "hurdak"

export const NEWLINE = "newline"
export const ELLIPSIS = "ellipsis"
export const TEXT = "text"
export const TOPIC = "topic"
export const LINK = "link"
export const INVOICE = "invoice"
export const NOSTR_NOTE = "nostr:note"
export const NOSTR_NEVENT = "nostr:nevent"
export const NOSTR_NPUB = "nostr:npub"
export const NOSTR_NPROFILE = "nostr:nprofile"
export const NOSTR_NADDR = "nostr:naddr"

export const urlIsMedia = (url: string) =>
  !url.match(/\.(apk|docx|xlsx|csv|dmg)/) && last(url.split("://"))?.includes("/")

export const parseContent = (event: {content: string; tags?: string[][]}) => {
  const result: any[] = []
  const tags = new Tags(event.tags || [])
  let text = event.content.trim() || tags.getValue("alt") || ""
  let buffer = ""

  const getMeta = (url, hash) => {
    const meta = tags
      .type("imeta")
      .map(
        pipe(
          drop<string>(1),
          map((m: string) => {
            const parts = m.split(" ")

            return [parts[0], parts.slice(1).join(" ")]
          }),
        ),
      )
      .filter(meta => new Tags(meta).type("url").nthEq(1, url).exists())
      .flatMap(identity)

    for (const [k, v] of new URLSearchParams(hash).entries()) {
      meta.xs.push([k, v])
    }

    return meta
  }

  const parseNewline = () => {
    const newline = first(text.match(/^\n+/))

    if (newline) {
      return [NEWLINE, newline, newline]
    }
  }

  const parseMention = () => {
    // Convert legacy mentions to bech32 entities
    const mentionMatch = text.match(/^#\[(\d+)\]/i)

    if (mentionMatch) {
      const i = parseInt(mentionMatch[1])

      if (tags?.[i]) {
        const [tag, value, url] = tags[i]
        const relays = [url].filter(identity)

        let type, data: any, entity
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
    const topic: string = first(text.match(/^#\w+/i))

    // Skip numeric topics
    if (topic && !topic.match(/^#\d+$/)) {
      return [TOPIC, topic, topic.slice(1)]
    }
  }

  const parseBech32 = () => {
    const bech32 = first(
      text.match(/^(web\+)?(nostr:)?\/?\/?n(event|ote|profile|pub|addr)1[\d\w]+/i),
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
        console.warn(e)
      }
    }
  }

  const parseInvoice = () => {
    const invoice = first(text.match(/^ln(bc|url)[\d\w]{50,1000}/i))

    if (invoice) {
      return [INVOICE, invoice, invoice]
    }
  }

  const parseUrl = () => {
    const raw: string = first(
      text.match(/^([a-z\+:]{2,30}:\/\/)?[^<>\(\)\s]+\.[a-z]{2,6}[^\s]*[^<>"'\.!?,:\s\)\(]/gi),
    )

    // Skip url if it's just the end of a filepath
    if (!raw) {
      return
    }

    const prev = last(result)

    if (prev?.type === "text" && prev.value.endsWith("/")) {
      return
    }

    // Strip hash component
    let [url, hash] = raw.split("#")

    // Skip ellipses and very short non-urls
    if (url.match(/\.\./)) {
      return
    }

    if (!url.match("://")) {
      url = "https://" + url
    }

    return [LINK, raw, {url, hash, isMedia: urlIsMedia(url), meta: getMeta(url, hash)}]
  }

  while (text) {
    const part =
      parseNewline() ||
      parseMention() ||
      parseTopic() ||
      parseBech32() ||
      parseUrl() ||
      parseInvoice()

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
    result.push({type: TEXT, value: buffer})
  }

  return result
}

type TruncateContentOpts = {
  showEntire: boolean
  maxLength: number
  showMedia: boolean
}

export const truncateContent = (
  content: any[],
  {showEntire, maxLength, showMedia = false}: TruncateContentOpts,
) => {
  if (showEntire) {
    return content
  }

  let length = 0
  const result: any[] = []
  const truncateAt = maxLength * 0.6
  const mediaLength = showMedia ? maxLength / 3 : 50
  const entityLength = 30

  content.every((part, i) => {
    length += switcherFn(part.type, {
      [LINK]: () => (part.value.isMedia ? mediaLength : entityLength),
      [INVOICE]: () => mediaLength,
      [NOSTR_NOTE]: () => mediaLength,
      [NOSTR_NEVENT]: () => mediaLength,
      [NOSTR_NPUB]: () => entityLength,
      [NOSTR_NPROFILE]: () => entityLength,
      [NOSTR_NADDR]: () => entityLength,
      default: () => part.value.length,
    })

    result.push(part)

    if (length > truncateAt && i < content.length - 1) {
      result.push({type: ELLIPSIS})

      return false
    }

    return true
  })

  return result
}

export const getLinks = (parts: any[]) =>
  pluck(
    "value",
    parts.filter(x => x.type === LINK && x.isMedia),
  )
