import {pick, last, prop, uniqBy} from "ramda"
import {get} from "svelte/store"
import {roomAttrs, displayPerson, findReplyId, findRootId} from "src/util/nostr"
import {getPubkeyWriteRelays, getRelayForPersonHint, sampleRelays} from "src/agent/relays"
import {getPersonWithFallback} from "src/agent/tables"
import pool from "src/agent/pool"
import sync from "src/agent/sync"
import keys from "src/agent/keys"

const authenticate = (challenge, relay) =>
  new PublishableEvent(22242, {
    tags: [
      ["challenge", challenge],
      ["relay", relay],
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
  mentions = mentions.map(pubkey => {
    const name = displayPerson(getPersonWithFallback(pubkey))
    const [{url}] = sampleRelays(getPubkeyWriteRelays(pubkey))

    return ["p", pubkey, url, name]
  })

  topics = topics.map(t => ["t", t])

  return new PublishableEvent(1, {content, tags: mentions.concat(topics)})
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

  return uniqBy(
    // Remove duplicates due to inheritance. Keep earlier ones
    t => t.slice(0, 2).join(":"),
    // Mentions have to come first for interpolation to work
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

const createReaction = (note, content) =>
  new PublishableEvent(7, {content, tags: getReplyTags(note)})

const createReply = (note, content, mentions = [], topics = []) => {
  // Mentions have to come first so interpolation works
  const tags = tagsFromParent(
    note,
    mentions
      .map(pk => ["p", pk, prop("url", getRelayForPersonHint(pk, note))])
      .concat(topics.map(t => ["t", t]))
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

class PublishableEvent {
  event: Record<string, any>
  constructor(kind, {content = "", tags = []}) {
    const pubkey = get(keys.pubkey)
    const createdAt = Math.round(new Date().valueOf() / 1000)

    tags.push(["client", "coracle"])

    this.event = {kind, content, tags, pubkey, created_at: createdAt}
  }
  async publish(relays, onProgress = null) {
    const event = await keys.sign(this.event)
    const promise = pool.publish({relays, event, onProgress})

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
