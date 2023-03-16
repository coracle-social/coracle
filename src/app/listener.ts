import {sortBy, max, find, pluck, slice, propEq} from "ramda"
import {derived} from "svelte/store"
import {doPipe} from "hurdak/lib/hurdak"
import {synced, now, timedelta} from "src/util/misc"
import {Tags, isNotification} from "src/util/nostr"
import {getUserReadRelays} from "src/agent/relays"
import {notifications, userEvents, contacts, rooms} from "src/agent/tables"
import {watch} from "src/agent/storage"
import network from "src/agent/network"
import user from "src/agent/user"

let listener

// State

export const lastChecked = synced("app/alerts/lastChecked", {})

export const newNotifications = derived(
  [watch("notifications", t => pluck("created_at", t.all()).reduce(max, 0)), lastChecked],
  ([$lastNotification, $lastChecked]) => $lastNotification > ($lastChecked.notifications || 0)
)

export const newDirectMessages = derived(
  [watch("contacts", t => t.all()), lastChecked],
  ([contacts, $lastChecked]) => Boolean(find(c => c.lastMessage > $lastChecked[c.pubkey], contacts))
)

export const newChatMessages = derived(
  [watch("rooms", t => t.all()), lastChecked],
  ([rooms, $lastChecked]) => Boolean(find(c => c.lastMessage > $lastChecked[c.pubkey], rooms))
)

// Synchronization from events to state

const processNotifications = async (pubkey, events) => {
  notifications.bulkPut(events.filter(e => isNotification(e, pubkey)))
}

const processMessages = async (pubkey, events) => {
  const messages = events.filter(propEq("kind", 4))

  if (messages.length === 0) {
    return
  }

  lastChecked.update($lastChecked => {
    for (const message of messages) {
      if (message.pubkey === pubkey) {
        const recipient = Tags.from(message).type("p").values().first()

        $lastChecked[recipient] = Math.max($lastChecked[recipient] || 0, message.created_at)
        contacts.patch({pubkey: recipient, accepted: true})
      } else {
        const contact = contacts.get(message.pubkey)
        const lastMessage = Math.max(contact?.lastMessage || 0, message.created_at)

        contacts.patch({pubkey: message.pubkey, lastMessage})
      }
    }

    return $lastChecked
  })
}

const processChats = async (pubkey, events) => {
  const messages = events.filter(propEq("kind", 42))

  if (messages.length === 0) {
    return
  }

  lastChecked.update($lastChecked => {
    for (const message of messages) {
      const id = Tags.from(message).type("e").values().first()

      if (message.pubkey === pubkey) {
        $lastChecked[id] = Math.max($lastChecked[id] || 0, message.created_at)
      } else {
        const room = rooms.get(id)
        const lastMessage = Math.max(room?.lastMessage || 0, message.created_at)

        rooms.patch({id, lastMessage})
      }
    }

    return $lastChecked
  })
}

const listen = async pubkey => {
  // Include an offset so we don't miss notifications on one relay but not another
  const since = now() - timedelta(30, "days")
  const roomIds = pluck("id", rooms.all({joined: true}))
  const eventIds = doPipe(userEvents.all({"created_at:gt": since, kind: 1}), [
    sortBy(e => -e.created_at),
    slice(0, 256),
    pluck("id"),
  ])

  if (listener) {
    listener.unsub()
  }

  listener = await network.listen({
    delay: 10000,
    relays: getUserReadRelays(),
    filter: [
      {kinds: [1, 4], authors: [pubkey], since},
      {kinds: [1, 7, 4, 9735], "#p": [pubkey], since},
      {kinds: [1, 7, 4, 9735], "#e": eventIds, since},
      {kinds: [42], "#e": roomIds, since},
    ],
    onChunk: async events => {
      events = user.applyMutes(events)

      await network.loadPeople(pluck("pubkey", events))
      await processNotifications(pubkey, events)
      await processMessages(pubkey, events)
      await processChats(pubkey, events)
    },
  })
}

export default {listen}
