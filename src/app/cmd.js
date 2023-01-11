import {join, uniqBy, last} from 'ramda'
import {get} from 'svelte/store'
import {first} from "hurdak/lib/hurdak"
import {Tags} from 'src/util/nostr'
import {keys, publish, getRelays} from 'src/agent'

const updateUser = (relays, updates) =>
  publishEvent(relays, 0, {content: JSON.stringify(updates)})

const setRelays = relays =>
  publishEvent(relays, 10001, {tags: relays.map(url => [url, "", ""])})

const setPetnames = (relays, petnames) =>
  publishEvent(relays, 3, {tags: petnames})

const muffle = (relays, muffle) =>
  publishEvent(relays, 12165, {tags: muffle})

const createRoom = (relays, room) =>
  publishEvent(relays, 40, {content: JSON.stringify(room)})

const updateRoom = (relays, {id, ...room}) =>
  publishEvent(relays, 41, {content: JSON.stringify(room), tags: [["e", id]]})

const createMessage = (relays, roomId, content) =>
  publishEvent(relays, 42, {content, tags: [["e", roomId, first(relays), "root"]]})

const createNote = (relays, content, mentions = []) =>
  publishEvent(relays, 1, {content, tags: mentions.map(p => ["p", p, first(getRelays(p))])})

const createReaction = (relays, note, content) => {
  const relay = getBestRelay(note)
  const tags = uniqBy(
    join(':'),
    note.tags
      .filter(t => ["p", "e"].includes(t[0]))
      .map(t => last(t) === 'root' ? t : t.slice(0, -1))
      .concat([["p", note.pubkey, relay], ["e", note.id, relay, 'reply']])
  )

  publishEvent(relays, 7, {content, tags})
}

const createReply = (relays, note, content, mentions = []) => {
  const relay = getBestRelay(note)
  const tags = uniqBy(
    join(':'),
    note.tags
      .filter(t => ["p", "e"].includes(t[0]))
      .map(t => last(t) === 'root' ? t : t.slice(0, -1))
      .concat([["p", note.pubkey, relay], ["e", note.id, relay, 'reply']])
      .concat(mentions.map(p => ["p", p, first(getRelays(p))]))
  )

  return publishEvent(relays, 1, {content, tags})
}

const deleteEvent = (relays, ids) =>
  publishEvent(relays, 5, {tags: ids.map(id => ["e", id])})

// Utils

const getBestRelay = event => {
  // Find the best relay, based on reply, root, or pubkey
  const reply = Tags.from(event).type("e").mark("reply").first()

  if (reply && reply[2].startsWith('ws')) {
    return reply[2]
  }

  const root = Tags.from(event).type("e").mark("root").first()

  if (root && root[2].startsWith('ws')) {
    return root[2]
  }

  return first(getRelays(event.pubkey))
}

const publishEvent = (relays, kind, {content = '', tags = []} = {}) => {
  if (relays.length === 0) {
    throw new Error("Unable to publish, no relays specified")
  }

  const pubkey = get(keys.pubkey)
  const createdAt = Math.round(new Date().valueOf() / 1000)
  const event = {kind, content, tags, pubkey, created_at: createdAt}

  return publish(relays, event)
}

export default {
  updateUser, setRelays, setPetnames, muffle, createRoom, updateRoom, createMessage, createNote,
  createReaction, createReply, deleteEvent,
}
