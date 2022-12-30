import {isNil, uniqBy, last} from 'ramda'
import {first} from "hurdak/lib/hurdak"
import relay from 'src/relay'

const updateUser = updates => publishEvent(0, JSON.stringify(updates))

const addPetname = (person, pubkey, name) =>
  publishEvent(3, '', uniqBy(t => t[1], person.petnames.concat([t("p", pubkey, name)])))

const removePetname = (person, pubkey) =>
  publishEvent(3, '', uniqBy(t => t[1], person.petnames.filter(t => t[1] !== pubkey)))

const muffle = (person, pubkey, value) => {
  const muffle = person.muffle
    .filter(x => x[1] !== pubkey)
    .concat([t("p", pubkey, value.toString())])
    .filter(x => last(x) !== "1")

  return publishEvent(12165, '', muffle)
}

const createRoom = room => publishEvent(40, JSON.stringify(room))

const updateRoom = ({id, ...room}) => publishEvent(41, JSON.stringify(room), [t("e", id)])

const createMessage = (roomId, content) => publishEvent(42, content, [t("e", roomId, "root")])

const createNote = (content, mentions = []) => publishEvent(1, content, mentions.map(p => t("p", p)))

const createReaction = (content, e) =>
  publishEvent(7, content, copyTags(e, [t("p", e.pubkey), t("e", e.id, 'reply')]))

const createReply = (e, content, mentions = []) => {
  const tags = mentions.map(p => t("p", p)).concat(
    copyTags(e, [t("p", e.pubkey), t("e", e.id, 'reply')])
  )

  return publishEvent(1, content, tags)
}

const deleteEvent = ids => publishEvent(5, '', ids.map(id => t("e", id)))

// utils

const copyTags = (e, newTags = []) => {
  return uniqBy(
    t => t.join(':'),
    e.tags
      .filter(t => ["p", "e"].includes(t[0]))
      .map(t => last(t) === 'reply' ? t.slice(0, -1) : t)
      .concat(newTags)
  )
}

export const t = (type, content, marker) => {
  const tag = [type, content, first(relay.pool.getRelays())]

  if (!isNil(marker)) {
    tag.push(marker)
  }

  return tag
}

const makeEvent = (kind, content = '', tags = []) => {
  const pubkey = relay.pool.getPubkey()
  const createdAt = Math.round(new Date().valueOf() / 1000)

  return {kind, content, tags, pubkey, created_at: createdAt}
}

const publishEvent = async (...args) => {
  const event = makeEvent(...args)

  await relay.pool.publishEvent(event)

  return event
}

export default {
  updateUser, addPetname, removePetname, muffle, createRoom, updateRoom, createMessage, createNote,
  createReaction, createReply, deleteEvent, publishEvent,
}
