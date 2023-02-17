import {last, identity, objOf, prop, flatten, uniq} from 'ramda'
import {nip19} from 'nostr-tools'
import {ensurePlural, ellipsize, first} from 'hurdak/lib/hurdak'

export const personKinds = [0, 2, 3, 10002, 12165]

export class Tags {
  constructor(tags) {
    this.tags = tags
  }
  static from(events) {
    return new Tags(ensurePlural(events).flatMap(prop('tags')))
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
  last() {
    return last(this.tags)
  }
  relays() {
    return uniq(flatten(this.tags).filter(isRelay)).map(objOf('url'))
  }
  pubkeys() {
    return this.type("p").values().all()
  }
  values() {
    return new Tags(this.tags.map(t => t[1]))
  }
  type(type) {
    return new Tags(this.tags.filter(t => t[0] === type))
  }
  mark(mark) {
    return new Tags(this.tags.filter(t => last(t) === mark))
  }
}

// Support the deprecated version where tags are not marked as replies
export const findReply = e =>
  Tags.from(e).type("e").mark("reply").first() || Tags.from(e).type("e").last()

export const findReplyId = e => Tags.wrap([findReply(e)]).values().first()

export const findRoot = e =>
  Tags.from(e).type("e").mark("root").first()

export const findRootId = e => Tags.wrap([findRoot(e)]).values().first()

export const displayPerson = p => {
  if (p.display_name) {
    return ellipsize(p.display_name, 60)
  }

  if (p.name) {
    return ellipsize(p.name, 60)
  }

  return nip19.npubEncode(p.pubkey).slice(4, 12)
}

export const isLike = content => ['', '+', '🤙', '👍', '❤️'].includes(content)

export const isAlert = (e, pubkey) => {
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

export const isRelay = url => typeof url === 'string' && url.match(/^wss?:\/\/.+/)

export const normalizeRelayUrl = url => url.replace(/\/+$/, '')

export const roomAttrs = ['name', 'about', 'picture']
