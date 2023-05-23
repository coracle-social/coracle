import {map, pick, uniqBy} from "ramda"
import {get} from "svelte/store"
import {doPipe} from "hurdak/lib/hurdak"
import {parseContent, Tags, roomAttrs, displayPerson, findRoot, findReply} from "src/util/nostr"
import {getRelayForPersonHint, getRelayForEventHint} from "src/agent/relays"
import {getPersonWithFallback} from "src/agent/db"
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

const setAppData = (d, content) => new PublishableEvent(30078, {content, tags: [["d", d]]})

const setPetnames = petnames => new PublishableEvent(3, {tags: petnames})

const setMutes = mutes => new PublishableEvent(10000, {tags: mutes})

const createList = list => new PublishableEvent(30001, {tags: list})

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
      tags => tags.concat(getReplyTags(note, true)),
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

  return new PublishableEvent(9734, {content, tags, tagClient: false})
}

const deleteEvent = ids => new PublishableEvent(5, {tags: ids.map(id => ["e", id])})

// Utils

const processMentions = map(pubkey => {
  const name = displayPerson(getPersonWithFallback(pubkey))
  const pHint = getRelayForPersonHint(pubkey)

  return ["p", pubkey, pHint?.url || "", name]
})

const tagsFromContent = (content, tags) => {
  const seen = new Set(Tags.wrap(tags).values().all())

  for (const {type, value} of parseContent({content})) {
    if (type.match(/nostr:(note|nevent)/) && !seen.has(value.id)) {
      tags = tags.concat([["e", value.id]])
      seen.add(value.id)
    }

    if (type.match(/nostr:(nprofile|npub)/) && !seen.has(value.pubkey)) {
      const name = displayPerson(getPersonWithFallback(value.pubkey))
      const pHint = getRelayForPersonHint(value.pubkey)

      tags = tags.concat([["p", value.pubkey, pHint?.url || "", name]])
      seen.add(value.pubkey)
    }
  }

  return tags
}

const getReplyTags = (n, inherit = false) => {
  const extra = inherit
    ? Tags.from(n)
        .type("e")
        .all()
        .map(t => t.slice(0, 3))
    : []
  const pHint = getRelayForPersonHint(n.pubkey)
  const eHint = getRelayForEventHint(n) || pHint
  const reply = ["e", n.id, eHint?.url || "", "reply"]
  const root = doPipe(findRoot(n) || findReply(n) || reply, [
    t => (t.length < 3 ? t.concat(eHint?.url || "") : t),
    t => t.slice(0, 3).concat("root"),
  ])

  return [["p", n.pubkey, pHint?.url || ""], root, ...extra, reply]
}

const uniqTags = uniqBy(t => t.slice(0, 2).join(":"))

class PublishableEvent {
  event: Record<string, any>
  constructor(kind, {content = "", tags = [], tagClient = true}) {
    const pubkey = get(keys.pubkey)
    const createdAt = Math.round(new Date().valueOf() / 1000)

    if (tagClient) {
      tags = tags.filter(t => t[0] !== "client").concat([["client", "coracle"]])
    }

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
    // console.log(event); return
    const promise = pool.publish({relays, event, onProgress, verb})

    // Copy the event since loki mutates it to add metadata
    sync.processEvents({...event})

    return [event, promise]
  }
}

export default {
  authenticate,
  updateUser,
  setRelays,
  setAppData,
  setPetnames,
  setMutes,
  createList,
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
