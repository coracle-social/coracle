import type {MyEvent} from 'src/util/types'
import {prop, pick, join, uniqBy, last} from 'ramda'
import {get} from 'svelte/store'
import {first} from "hurdak/lib/hurdak"
import {log} from 'src/util/logger'
import {roomAttrs, displayPerson} from 'src/util/nostr'
import {getPubkeyWriteRelays, getRelayForPersonHint} from 'src/agent/relays'
import database from 'src/agent/database'
import network from 'src/agent/network'
import keys from 'src/agent/keys'

const updateUser = (relays, updates) =>
  publishEvent(relays, 0, {content: JSON.stringify(updates)})

const setRelays = (relays, newRelays) =>
  publishEvent(relays, 10002, {
    tags: newRelays.map(r => {
      const t = ["r", r.url]

      if (!r.write) {
        t.push('read')
      }

      return t
    }),
  })

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
  publishEvent(relays, 4, {content, tags: [["p", pubkey]]})

const createNote = (relays, content, mentions = [], topics = []) => {
  mentions = mentions.map(pubkey => {
    const name = displayPerson(database.getPersonWithFallback(pubkey))
    const [{url}] = getPubkeyWriteRelays(pubkey)

    return ["p", pubkey, url, name]
  })

  topics = topics.map(t => ["t", t])

  return publishEvent(relays, 1, {content, tags: mentions.concat(topics)})
}

const createReaction = (relays, note, content) => {
  const {url} = getRelayForPersonHint(note.pubkey, note)
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
  topics = topics.map(t => ["t", t])
  mentions = mentions.map(pubkey => {
    const [{url}] = getRelayForPersonHint(pubkey, note)

    return ["p", pubkey, url]
  })

  const [{url}] = getRelayForPersonHint(note.pubkey, note)
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

const publishEvent = (relays, kind, {content = '', tags = []} = {}): [MyEvent, Promise<MyEvent>] => {
  if (relays.length === 0) {
    throw new Error("Unable to publish, no relays specified")
  }

  const pubkey = get(keys.pubkey)
  const createdAt = Math.round(new Date().valueOf() / 1000)
  const event = {kind, content, tags, pubkey, created_at: createdAt} as MyEvent

  log("Publishing", event, relays)

  // Return the event synchronously, separate from the promise
  return [event, network.publish(relays, event)]
}

export default {
  updateUser, setRelays, setPetnames, muffle, createRoom, updateRoom,
  createChatMessage, createDirectMessage, createNote, createReaction,
  createReply, deleteEvent,
}
