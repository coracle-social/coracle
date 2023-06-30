import type {DisplayEvent} from "src/util/types"
import {is, fromPairs, mergeLeft, last, identity, objOf, prop, flatten, uniq} from "ramda"
import {nip19} from "nostr-tools"
import {ensurePlural, first} from "hurdak/lib/hurdak"
import {tryJson, avg} from "src/util/misc"

export const noteKinds = [1, 1985, 30023, 1063, 9802]
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
  topics() {
    return this.type("t")
      .values()
      .all()
      .map(t => t.replace(/^#/, ""))
  }
  pubkeys() {
    return this.type("p").values().all()
  }
  urls() {
    return this.type("r").values().all()
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
  reject(f) {
    return new Tags(this.tags.filter(t => !f(t)))
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
  const tags = Tags.from(e)
    .type("e")
    .filter(t => last(t) !== "mention")
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

export const normalizeRelayUrl = url => {
  url = url.replace(/\/+$/, "").toLowerCase().trim()

  if (!url.startsWith("ws")) {
    url = "wss://" + url
  }

  return url
}

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

export const fromNostrURI = s => s.replace(/^[\w\+]+:\/?\/?/, "")

export const toNostrURI = s => `web+nostr://${s}`

export const getLabelQuality = (label, event) =>
  tryJson(() => JSON.parse(last(Tags.from(event).type("l").equals(label).first())).quality)

export const getAvgQuality = (label, events) =>
  avg(events.map(e => getLabelQuality(label, e)).filter(identity))
