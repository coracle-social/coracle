import {prop, pick, join, uniqBy, last} from 'ramda'
import {get} from 'svelte/store'
import {first} from "hurdak/lib/hurdak"
import {Tags, isRelay, roomAttrs, displayPerson} from 'src/util/nostr'
import {keys, publish, getRelays, getPerson} from 'src/agent'

const updateUser = (relays, updates) =>
  publishEvent(relays, 0, {content: JSON.stringify(updates)})

const setRelays = (relays, newRelays) =>
  publishEvent(relays, 10001, {tags: newRelays.map(r => [r.url, r.read || "", r.write || ""])})

const setPetnames = (relays, petnames) =>
  publishEvent(relays, 3, {tags: petnames})

const muffle = (relays, muffle) =>
  publishEvent(relays, 12165, {tags: muffle})

const createRoom = (relays, room) =>
  publishEvent(relays, 40, {content: JSON.stringify(pick(roomAttrs, room))})

const updateRoom = (relays, {id, ...room}) =>
  publishEvent(relays, 41, {content: JSON.stringify(pick(roomAttrs, room)), tags: [["e", id]]})

const createChatMessage = (relays, roomId, content) =>
  publishEvent(relays, 42, {content, tags: [["e", roomId, prop('url', first(relays)), "root"]]})

const createDirectMessage = (relays, pubkey, content) =>
  // todo, encrypt messages
  publishEvent(relays, 4, {content, tags: [["p", pubkey]]})

const createNote = (relays, content, mentions = [], topics = []) => {
  mentions = mentions.map(p => {
    const {url} = first(getRelays(p))
    const name = displayPerson(getPerson(p, true))

    return ["p", p, url, name]
  })

  topics = topics.map(t => ["t", t])

  publishEvent(relays, 1, {content, tags: mentions.concat(topics)})
}

const createReaction = (relays, note, content) => {
  const {url} = getBestRelay(relays, note)
  const tags = uniqBy(
    join(':'),
    note.tags
      .filter(t => ["p", "e"].includes(t[0]))
      .map(t => last(t) === 'reply' ? t.slice(0, -1) : t)
      .concat([["p", note.pubkey, url], ["e", note.id, url, 'reply']])
  )

  return publishEvent(relays, 7, {content, tags})
}

const createReply = (relays, note, content, mentions = [], topics = []) => {
  mentions = mentions.map(p => ["p", p, prop('url', first(getRelays(p)))])
  topics = topics.map(t => ["t", t])

  const {url} = getBestRelay(relays, note)
  const tags = uniqBy(
    join(':'),
    note.tags
      .filter(t => ["e"].includes(t[0]))
      .map(t => last(t) === 'reply' ? t.slice(0, -1) : t)
      .concat([["p", note.pubkey, url], ["e", note.id, url, 'reply']])
      .concat(mentions.concat(topics))
  )

  return publishEvent(relays, 1, {content, tags})
}

const deleteEvent = (relays, ids) =>
  publishEvent(relays, 5, {tags: ids.map(id => ["e", id])})

// Utils

const getBestRelay = (relays, event) => {
  // Find the best relay, based on reply, root, or pubkey. Fall back to a
  // relay we're going to send the event to
  const tags = Tags.from(event).type("e")
  const reply = tags.mark("reply").values().first()
  const root = tags.mark("root").values().first()

  if (isRelay(reply)) {
    return reply
  }

  if (isRelay(root)) {
    return root
  }

  return first(getRelays(event.pubkey).concat(relays))
}

const publishEvent = (relays, kind, {content = '', tags = []} = {}) => {
  if (relays.length === 0) {
    throw new Error("Unable to publish, no relays specified")
  }

  const pubkey = get(keys.pubkey)
  const createdAt = Math.round(new Date().valueOf() / 1000)
  const event = {kind, content, tags, pubkey, created_at: createdAt}

  console.log("Publishing", event, relays)

  return publish(relays, event)
}

export default {
  updateUser, setRelays, setPetnames, muffle, createRoom, updateRoom,
  createChatMessage, createDirectMessage, createNote, createReaction,
  createReply, deleteEvent,
}
