import {map, pick, last, uniqBy} from "ramda"
import {get} from "svelte/store"
import {doPipe} from "hurdak/lib/hurdak"
import {parseContent} from "src/util/html"
import {Tags, roomAttrs, displayPerson, findReplyId, findRootId} from "src/util/nostr"
import {getRelayForPersonHint} from "src/agent/relays"
import {getPersonWithFallback} from "src/agent/tables"
import pool from "src/agent/pool"
import sync from "src/agent/sync"
import keys from "src/agent/keys"

const authenticate = (url, challenge) =>
  new PublishableEvent(22242, {
    tags: [
      ["challenge", challenge],
      ["relay", url],
    ],
  })

const updateUser = updates => new PublishableEvent(0, {content: JSON.stringify(updates)})

const setRelays = newRelays =>
  new PublishableEvent(10002, {
    tags: newRelays.map(r => {
      const t = ["r", r.url]

      if (!r.write) {
        t.push("read")
      }

      return t
    }),
  })

const setPetnames = petnames => new PublishableEvent(3, {tags: petnames})

const setMutes = mutes => new PublishableEvent(10000, {tags: mutes})

const createRoom = room =>
  new PublishableEvent(40, {content: JSON.stringify(pick(roomAttrs, room))})

const updateRoom = ({id, ...room}) =>
  new PublishableEvent(41, {content: JSON.stringify(pick(roomAttrs, room)), tags: [["e", id]]})

const createChatMessage = (roomId, content, url) =>
  new PublishableEvent(42, {content, tags: [["e", roomId, url, "root"]]})

const createDirectMessage = (pubkey, content) =>
  new PublishableEvent(4, {content, tags: [["p", pubkey]]})

const createNote = (content, mentions = [], topics = []) => {
  // Mentions have to come first so interpolation works
  const tags = doPipe(
    [],
    [
      tags => tags.concat(processMentions(mentions)),
      tags => tags.concat(topics.map(t => ["t", t])),
      tags => tagsFromContent(content, tags),
      uniqTags,
    ]
  )

  return new PublishableEvent(1, {content, tags})
}

const createReaction = (note, content) =>
  new PublishableEvent(7, {content, tags: getReplyTags(note)})

const createReply = (note, content, mentions = [], topics = []) => {
  // Mentions have to come first so interpolation works
  const tags = doPipe(
    [],
    [
      tags => tags.concat(processMentions(mentions)),
      tags => tags.concat(topics.map(t => ["t", t])),
      tags => tagsFromParent(note, tags),
      tags => tagsFromContent(content, tags),
      uniqTags,
    ]
  )

  return new PublishableEvent(1, {content, tags})
}

const requestZap = (relays, content, pubkey, eventId, amount, lnurl) => {
  const tags = [
    ["relays", ...relays],
    ["amount", amount.toString()],
    ["lnurl", lnurl],
    ["p", pubkey],
  ]

  if (eventId) {
    tags.push(["e", eventId])
  }

  return new PublishableEvent(9734, {content, tags})
}

const deleteEvent = ids => new PublishableEvent(5, {tags: ids.map(id => ["e", id])})

// Utils

const processMentions = map(pubkey => {
  const name = displayPerson(getPersonWithFallback(pubkey))
  const relay = getRelayForPersonHint(pubkey)

  return ["p", pubkey, relay?.url || "", name]
})

const tagsFromContent = (content, tags) => {
  const seen = new Set(Tags.wrap(tags).values().all())

  for (const {type, value} of parseContent(content)) {
    if (type.match(/nostr:(note|nevent)/) && !seen.has(value.id)) {
      tags = tags.concat([["e", value.id]])
      seen.add(value.id)
    }

    if (type.match(/nostr:(nprofile|npub)/) && !seen.has(value.pubkey)) {
      const name = displayPerson(getPersonWithFallback(value.pubkey))
      const relay = getRelayForPersonHint(value.pubkey)

      tags = tags.concat([["p", value.pubkey, relay?.url || "", name]])
      seen.add(value.pubkey)
    }
  }

  return tags
}

const getReplyTags = n => {
  const {url} = getRelayForPersonHint(n.pubkey, n)
  const rootId = findRootId(n) || findReplyId(n) || n.id

  return [
    ["p", n.pubkey, url],
    ["e", n.id, url, "reply"],
    ["e", rootId, url, "root"],
  ]
}

const tagsFromParent = (n, newTags = []) => {
  const pubkey = get(keys.pubkey)

  // Mentions have to come first for interpolation to work
  return (
    newTags
      // Add standard reply tags
      .concat(getReplyTags(n))
      // Inherit p and e tags, but remove marks and self-mentions
      .concat(
        n.tags.filter(t => {
          if (t[1] === pubkey) return false
          if (!["p", "e"].includes(t[0])) return false
          if (["reply", "root"].includes(last(t))) return false

          return true
        })
      )
  )
}

const uniqTags = uniqBy(t => t.slice(0, 2).join(":"))

class PublishableEvent {
  event: Record<string, any>
  constructor(kind, {content = "", tags = []}) {
    const pubkey = get(keys.pubkey)
    const createdAt = Math.round(new Date().valueOf() / 1000)

    tags.push(["client", "coracle"])

    this.event = {kind, content, tags, pubkey, created_at: createdAt}
  }
  getSignedEvent() {
    try {
      return keys.sign(this.event)
    } catch (e) {
      console.log(this.event)
      throw e
    }
  }
  async publish(relays, onProgress = null, verb = "EVENT") {
    const event = await this.getSignedEvent()
    //console.log(event); return
    const promise = pool.publish({relays, event, onProgress, verb})

    sync.processEvents(event)

    return [event, promise]
  }
}

export default {
  authenticate,
  updateUser,
  setRelays,
  setPetnames,
  setMutes,
  createRoom,
  updateRoom,
  createChatMessage,
  createDirectMessage,
  createNote,
  createReaction,
  createReply,
  requestZap,
  deleteEvent,
  PublishableEvent,
}
