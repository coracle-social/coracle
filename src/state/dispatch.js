import {identity, isNil, uniqBy, last} from 'ramda'
import {first, defmulti} from "hurdak/lib/hurdak"
import relay from 'src/relay'

// Commands are processed in two layers:
// - App-oriented commands are created via dispatch
// - processEvent, which can be used to populate the database
//   whether commands are coming from our instance or a remote instance.

export const dispatch = defmulti("dispatch", identity)

dispatch.addMethod("user/update", async (topic, updates) => {
  await relay.pool.publishEvent(makeEvent(0, JSON.stringify(updates)))
})

dispatch.addMethod("user/petnames", async (topic, petnames) => {
  await relay.pool.publishEvent(makeEvent(3, '', petnames))
})

dispatch.addMethod("user/muffle", async (topic, muffle) => {
  await relay.pool.publishEvent(makeEvent(12165, '', muffle))
})

dispatch.addMethod("room/create", async (topic, room) => {
  const event = makeEvent(40, JSON.stringify(room))

  await relay.pool.publishEvent(event)

  return event
})

dispatch.addMethod("room/update", async (topic, {id, ...room}) => {
  const event = makeEvent(41, JSON.stringify(room), [t("e", id)])

  await relay.pool.publishEvent(event)

  return event
})

dispatch.addMethod("message/create", async (topic, roomId, content) => {
  const event = makeEvent(42, content, [t("e", roomId, "root")])

  await relay.pool.publishEvent(event)

  return event
})

dispatch.addMethod("note/create", async (topic, content, tags=[]) => {
  const event = makeEvent(1, content, tags)

  await relay.pool.publishEvent(event)

  return event
})

dispatch.addMethod("reaction/create", async (topic, content, e) => {
  const tags = copyTags(e, [t("p", e.pubkey), t("e", e.id, 'reply')])
  const event = makeEvent(7, content, tags)

  await relay.pool.publishEvent(event)

  return event
})

dispatch.addMethod("reply/create", async (topic, content, e) => {
  const tags = copyTags(e, [t("p", e.pubkey), t("e", e.id, 'reply')])
  const event = makeEvent(1, content, tags)

  await relay.pool.publishEvent(event)

  return event
})

dispatch.addMethod("event/delete", async (topic, ids) => {
  const event = makeEvent(5, '', ids.map(id => t("e", id)))

  await relay.pool.publishEvent(event)

  return event
})

// utils

export const copyTags = (e, newTags = []) => {
  // Remove reply type from e tags
  return uniqBy(
    t => t.join(':'),
    e.tags.map(t => last(t) === 'reply' ? t.slice(0, -1) : t).concat(newTags)
  )
}

export const t = (type, content, marker) => {
  const tag = [type, content, first(Object.keys(relay.pool.relays))]

  if (!isNil(marker)) {
    tag.push(marker)
  }

  return tag
}

export const makeEvent = (kind, content = '', tags = []) => {
  const pubkey = relay.pool.getPubkey()
  const createdAt = Math.round(new Date().valueOf() / 1000)

  return {kind, content, tags, pubkey, created_at: createdAt}
}
