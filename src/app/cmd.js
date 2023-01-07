import {isNil, uniqBy, last} from 'ramda'
import {get} from 'svelte/store'
import {first} from "hurdak/lib/hurdak"
import {keys, publish, user} from 'src/agent'

const updateUser = updates => publishEvent(0, JSON.stringify(updates))

const setRelays = relays => publishEvent(10001, "", relays.map(url => [url, "", ""]))

const setPetnames = petnames => publishEvent(3, "", petnames)

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
  const relays = get(user).relays || []
  const tag = [type, content, first(relays)]

  if (!isNil(marker)) {
    tag.push(marker)
  }

  return tag
}

const makeEvent = (kind, content = '', tags = []) => {
  const pubkey = get(keys.pubkey)
  const createdAt = Math.round(new Date().valueOf() / 1000)

  return {kind, content, tags, pubkey, created_at: createdAt}
}

const publishEvent = (...args) => {
  const relays = get(user).relays || []

  if (relays.length === 0) {
    throw new Error("Unable to publish, user has no relays")
  }

  publish(relays, makeEvent(...args))
}

export default {
  updateUser, setRelays, setPetnames, muffle, createRoom, updateRoom, createMessage, createNote,
  createReaction, createReply, deleteEvent, publishEvent,
}
