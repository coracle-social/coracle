import {identity, last, without} from 'ramda'
import {getPublicKey} from 'nostr-tools'
import {get} from 'svelte/store'
import {first, defmulti} from "hurdak/lib/hurdak"
import {user} from "src/state/user"
import {nostr, channels, relays} from 'src/state/nostr'

// Commands are processed in two layers:
// - App-oriented commands are created via dispatch
// - processEvent, which can be used to populate the database
//   whether commands are coming from our instance or a remote instance.

export const dispatch = defmulti("dispatch", identity)

dispatch.addMethod("account/init", async (topic, privkey) => {
  // Generate a public key
  const pubkey = getPublicKey(privkey)

  // Set what we know about the user to our store
  user.set({name: pubkey.slice(0, 8), privkey, pubkey})

  // Attempt to refresh user data from the network
  const found = Boolean(await channels.getter.first({authors: [pubkey]}))

  // Tell the caller whether this user was found
  return {found}
})

dispatch.addMethod("account/update", async (topic, updates) => {
  // Update our local copy
  user.set({...get(user), ...updates})

  // Tell the network
  await nostr.publish(nostr.event(0, JSON.stringify(updates)))
})

dispatch.addMethod("relay/join", (topic, url) => {
  relays.update(r => r.concat(url))
})

dispatch.addMethod("relay/leave", (topic, url) => {
  relays.update(r => without([url], r))
})

dispatch.addMethod("room/create", async (topic, room) => {
  const event = nostr.event(40, JSON.stringify(room))

  await nostr.publish(event)

  return event
})

dispatch.addMethod("room/update", async (topic, {id, ...room}) => {
  const event = nostr.event(41, JSON.stringify(room), [t("e", id)])

  await nostr.publish(event)

  return event
})

dispatch.addMethod("message/create", async (topic, roomId, content) => {
  const event = nostr.event(42, content, [t("e", roomId, "root")])

  await nostr.publish(event)

  return event
})

dispatch.addMethod("note/create", async (topic, content, tags=[]) => {
  const event = nostr.event(1, content, tags)

  await nostr.publish(event)

  return event
})

dispatch.addMethod("reaction/create", async (topic, content, e) => {
  const tags = copyTags(e).concat([t("p", e.pubkey), t("e", e.id, 'reply')])
  const event = nostr.event(7, content, tags)

  await nostr.publish(event)

  return event
})

dispatch.addMethod("reply/create", async (topic, content, e) => {
  const tags = copyTags(e).concat([t("p", e.pubkey), t("e", e.id, 'reply')])
  const event = nostr.event(1, content, tags)

  await nostr.publish(event)

  return event
})

dispatch.addMethod("event/delete", async (topic, ids) => {
  const event = nostr.event(5, '', ids.map(id => t("e", id)))

  await nostr.publish(event)

  return event
})

// utils

export const copyTags = e => {
  // Remove reply type from e tags
  return e.tags.map(t => last(t) === 'reply' ? t.slice(0, -1) : t)
}

export const t = (type, content, marker) => {
  const tag = [type, content, first(get(relays))]

  if (marker) {
    tag.push(marker)
  }

  return tag
}
