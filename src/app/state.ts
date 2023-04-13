import type {DisplayEvent} from "src/util/types"
import Bugsnag from "@bugsnag/js"
import {nip19} from "nostr-tools"
import {navigate} from "svelte-routing"
import {derived} from "svelte/store"
import {writable} from "svelte/store"
import {omit, pluck, sortBy, max, find, slice, propEq} from "ramda"
import {createMap, doPipe, first} from "hurdak/lib/hurdak"
import {warn} from "src/util/logger"
import {hash} from "src/util/misc"
import {synced, now, timedelta} from "src/util/misc"
import {Tags, isNotification} from "src/util/nostr"
import {findReplyId} from "src/util/nostr"
import {modal, toast} from "src/partials/state"
import {notifications, watch, userEvents, contacts, rooms} from "src/agent/db"
import keys from "src/agent/keys"
import network from "src/agent/network"
import pool from "src/agent/pool"
import {getUserReadRelays, getUserRelays} from "src/agent/relays"
import {getUserFollows} from "src/agent/social"
import user from "src/agent/user"

// Routing

export const routes = {
  person: (pubkey, tab = "notes") => `/people/${nip19.npubEncode(pubkey)}/${tab}`,
}

export const goToPerson = pubkey => {
  if (document.querySelector(".modal-content")) {
    navigate(routes.person(pubkey))
  } else {
    modal.push({type: "person/feed", pubkey})
  }
}

export const addToFeed = (key, value) => modal.push({type: "feed/select", key, value})

// Menu

export const menuIsOpen = writable(false)

// Redact long strings, especially hex and bech32 keys which are 64 and 63
// characters long, respectively. Put the threshold a little lower in case
// someone accidentally enters a key with the last few digits missing
const redactErrorInfo = info =>
  JSON.parse(JSON.stringify(info || null).replace(/\w{60}\w+/g, "[REDACTED]"))

// Wait for bugsnag to be started in main
setTimeout(() => {
  Bugsnag.addOnError((event: any) => {
    if (window.location.host.startsWith("localhost")) {
      return false
    }

    if (!user.getSetting("reportAnalytics")) {
      return false
    }

    // Redact individual properties since the event needs to be
    // mutated, and we don't want to lose the prototype
    event.context = redactErrorInfo(event.context)
    event.request = redactErrorInfo(event.request)
    event.exceptions = redactErrorInfo(event.exceptions)
    event.breadcrumbs = redactErrorInfo(event.breadcrumbs)

    event.setUser(session)

    return true
  })
})

const session = Math.random().toString().slice(2)

export const logUsage = async name => {
  // Hash the user's pubkey so we can identify unique users without knowing
  // anything about them
  const pubkey = user.getPubkey()
  const ident = pubkey ? hash(pubkey) : "unknown"
  const {dufflepudUrl, reportAnalytics} = user.getSettings()

  if (reportAnalytics) {
    try {
      await fetch(`${dufflepudUrl}/usage/${ident}/${session}/${name}`, {method: "post"})
    } catch (e) {
      if (!e.toString().includes("Failed to fetch")) {
        warn(e)
      }
    }
  }
}

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
  notifications.patch(events.filter(e => isNotification(e, pubkey)))
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

export const listen = async pubkey => {
  // Include an offset so we don't miss notifications on one relay but not another
  const since = now() - timedelta(30, "days")
  const roomIds = pluck("id", rooms.all({joined: true}))
  const eventIds = doPipe(userEvents.all({kind: 1, created_at: {$gt: since}}), [
    sortBy(e => -e.created_at),
    slice(0, 256),
    pluck("id"),
  ])

  ;(listen as any)._listener?.unsub()
  ;(listen as any)._listener = await network.listen({
    delay: 5000,
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

export const slowConnections = writable([])

setInterval(() => {
  // Only notify about relays the user is actually subscribed to
  const relayUrls = new Set(pluck("url", getUserRelays()))

  // Prune connections we haven't used in a while
  Object.entries(pool.Meta.stats)
    .filter(([url, stats]) => stats.lastRequest < Date.now() - 60_000)
    .forEach(([url, stats]) => pool.disconnect(url))

  // Alert the user to any heinously slow connections
  slowConnections.set(
    Object.keys(pool.Meta.stats).filter(
      url => relayUrls.has(url) && first(pool.getQuality(url)) < 0.3
    )
  )
}, 30_000)

export const loadAppData = async pubkey => {
  if (getUserReadRelays().length > 0) {
    // Start our listener, but don't wait for it
    listen(pubkey)

    // Make sure the user and their network is loaded
    await network.loadPeople([pubkey], {force: true})
    await network.loadPeople(getUserFollows())
  }
}

export const login = (method, key) => {
  keys.login(method, key)

  modal.push({type: "login/connect", noEscape: true})
}

export const mergeParents = (notes: Array<DisplayEvent>) => {
  const notesById = createMap("id", notes) as Record<string, DisplayEvent>
  const childIds = []

  for (const note of Object.values(notesById)) {
    const parentId = findReplyId(note)

    if (parentId) {
      childIds.push(note.id)
    }

    // Add the current note to its parents replies, but only if we found a parent
    if (notesById[parentId]) {
      notesById[parentId].replies = notesById[parentId].replies.concat([note])
    }
  }

  return sortBy(e => -e.created_at, Object.values(omit(childIds, notesById)))
}

export const publishWithToast = (relays, thunk) =>
  thunk.publish(relays, ({completed, succeeded, failed, timeouts, pending}) => {
    let message = `Published to ${succeeded.size}/${relays.length} relays`

    const extra = []
    if (failed.size > 0) {
      extra.push(`${failed.size} failed`)
    }

    if (timeouts.size > 0) {
      extra.push(`${timeouts.size} timed out`)
    }

    if (pending.size > 0) {
      extra.push(`${pending.size} pending`)
    }

    if (extra.length > 0) {
      message += ` (${extra.join(", ")})`
    }

    toast.show("info", message, pending.size ? null : 5)
  })
