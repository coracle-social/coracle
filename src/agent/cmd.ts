import {pick, join, uniqBy, last} from 'ramda'
import {get} from 'svelte/store'
import {roomAttrs, displayPerson, findReplyId, findRootId} from 'src/util/nostr'
import {getPubkeyWriteRelays, getRelayForPersonHint, sampleRelays} from 'src/agent/relays'
import database from 'src/agent/database'
import pool from 'src/agent/pool'
import sync from 'src/agent/sync'
import keys from 'src/agent/keys'

const updateUser = updates =>
  new PublishableEvent(0, {content: JSON.stringify(updates)})

const setRelays = newRelays =>
  new PublishableEvent(10002, {
    tags: newRelays.map(r => {
      const t = ["r", r.url]

      if (!r.write) {
        t.push('read')
      }

      return t
    }),
  })

const setPetnames = petnames =>
  new PublishableEvent(3, {tags: petnames})

const muffle = muffle =>
  new PublishableEvent(12165, {tags: muffle})

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
    const name = displayPerson(database.getPersonWithFallback(pubkey))
    const [{url}] = sampleRelays(getPubkeyWriteRelays(pubkey))

    return ["p", pubkey, url, name]
  })

  topics = topics.map(t => ["t", t])

  return new PublishableEvent(1, {content, tags: mentions.concat(topics)})
}

const createReaction = (note, content) => {
  const {url} = getRelayForPersonHint(note.pubkey, note)
  const tags = uniqBy(
    join(':'),
    note.tags
      .filter(t => ["p", "e"].includes(t[0]))
      .map(t => last(t) === 'reply' ? t.slice(0, -1) : t)
      .concat([["p", note.pubkey, url], ["e", note.id, url, 'reply']])
  )

  return new PublishableEvent(7, {content, tags})
}

const createReply = (note, content, mentions = [], topics = []) => {
  topics = topics.map(t => ["t", t])
  mentions = mentions.map(pubkey => {
    const {url} = getRelayForPersonHint(pubkey, note)

    return ["p", pubkey, url]
  })

  const {url} = getRelayForPersonHint(note.pubkey, note)
  const rootId = findRootId(note) || findReplyId(note) || note.id
  const tags = uniqBy(
    join(':'),
    note.tags
      .filter(t => ["e"].includes(t[0]))
      .map(t => last(t) === 'reply' ? t.slice(0, -1) : t)
      .concat(mentions.concat(topics))
      .concat([
        ["p", note.pubkey, url],
        ["e", note.id, url, 'reply'],
        ["e", rootId, url, 'root'],
      ])
  )

  return new PublishableEvent(1, {content, tags})
}

const requestZap = (relays, content, pubkey, eventId, amount, lnurl) => {
  const tags = [["relays", ...relays], ["amount", amount], ["lnurl", lnurl], ["p", pubkey]]

  if (eventId) {
    tags.push(["e", eventId])
  }

  return new PublishableEvent(9734, {content, tags})
}

const deleteEvent = ids =>
  new PublishableEvent(5, {tags: ids.map(id => ["e", id])})

// Utils

class PublishableEvent {
  event: Record<string, any>
  constructor(kind, {content = '', tags = []}) {
    const pubkey = get(keys.pubkey)
    const createdAt = Math.round(new Date().valueOf() / 1000)

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
  updateUser, setRelays, setPetnames, muffle, createRoom, updateRoom,
  createChatMessage, createDirectMessage, createNote, createReaction,
  createReply, requestZap, deleteEvent, PublishableEvent,
}
