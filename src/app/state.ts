import type {DisplayEvent} from "src/util/types"
import Bugsnag from "@bugsnag/js"
import {nip19} from "nostr-tools"
import {navigate} from "svelte-routing"
import {derived} from "svelte/store"
import {writable} from "svelte/store"
import {max, omit, pluck, sortBy, find, slice, propEq} from "ramda"
import {createMap, doPipe, first} from "hurdak/lib/hurdak"
import {warn} from "src/util/logger"
import {hash, sleep} from "src/util/misc"
import {now, timedelta} from "src/util/misc"
import {Tags, isNotification, userKinds} from "src/util/nostr"
import {findReplyId} from "src/util/nostr"
import {modal, toast} from "src/partials/state"
import {notifications, watch, userEvents, contacts, rooms} from "src/agent/db"
import {enableZaps} from "src/agent/settings"
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

export const addToList = (type, value) => modal.push({type: "list/select", item: {type, value}})

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

// Feed

export const feedsTab = writable("Follows")

// State

export const newNotifications = derived(
  [watch("notifications", t => pluck("created_at", t.all()).reduce(max, 0)), user.lastChecked],
  ([$lastNotification, $lastChecked]) => $lastNotification > ($lastChecked.notifications || 0)
)

export const hasNewMessages = ({lastReceived, lastSent}, lastChecked) =>
  lastReceived > Math.max(lastSent || lastReceived, lastChecked || 0)

export const newDirectMessages = derived(
  [watch("contacts", t => t.all()), user.lastChecked],
  ([contacts, $lastChecked]) =>
    Boolean(find(c => hasNewMessages(c, $lastChecked[`dm/${c.pubkey}`]), contacts))
)

export const newChatMessages = derived(
  [watch("rooms", t => t.all()), user.lastChecked, user.roomsJoined],
  ([rooms, $lastChecked, $roomsJoined]) =>
    Boolean(
      find(
        r => $roomsJoined.includes(r.id) && hasNewMessages(r, $lastChecked[`chat/${r.id}`]),
        rooms
      )
    )
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

  for (const message of messages) {
    const fromSelf = message.pubkey === pubkey
    const contactPubkey = fromSelf ? Tags.from(message).getMeta("p") : message.pubkey
    const contact = contacts.get(contactPubkey)
    const key = fromSelf ? "lastSent" : "lastReceived"

    contacts.patch({
      pubkey: contactPubkey,
      [key]: Math.max(contact?.[key] || 0, message.created_at),
    })
  }
}

const processChats = async (pubkey, events) => {
  const messages = events.filter(propEq("kind", 42))

  if (messages.length === 0) {
    return
  }

  for (const message of messages) {
    const fromSelf = message.pubkey === pubkey
    const id = Tags.from(message).getMeta("e")
    const room = rooms.get(id)
    const key = fromSelf ? "lastSent" : "lastReceived"

    rooms.patch({id, [key]: Math.max(room?.[key] || 0, message.created_at)})
  }
}

export const listen = async () => {
  const pubkey = user.getPubkey()
  const {roomsJoined} = user.getProfile()
  const since = now() - timedelta(30, "days")
  const kinds = enableZaps ? [1, 4, 7, 9735] : [1, 4, 7]
  const eventIds = doPipe(userEvents.all({kind: 1, created_at: {$gt: since}}), [
    sortBy(e => -e.created_at),
    slice(0, 256),
    pluck("id"),
  ])

  ;(listen as any)._listener?.unsub()
  ;(listen as any)._listener = await network.listen({
    relays: getUserReadRelays(),
    filter: [
      {kinds: [1, 4], authors: [pubkey], since},
      {kinds, "#p": [pubkey], since},
      {kinds, "#e": eventIds, since},
      {kinds: [42], "#e": roomsJoined, since},
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
    listen()

    // Make sure the user and their network is loaded
    await network.loadPeople([pubkey], {force: true, kinds: userKinds})
    await network.loadPeople(getUserFollows())
  }
}

export const login = async (method, key) => {
  keys.login(method, key)

  if (pool.forceUrls.length > 0) {
    modal.replace({
      type: "message",
      message: "Logging you in...",
      spinner: true,
      noEscape: true,
    })

    await Promise.all([
      sleep(1500),
      network.loadPeople([user.getPubkey()], {force: true, kinds: userKinds}),
    ])

    navigate("/notes")
  } else {
    modal.push({type: "login/connect", noEscape: true})
  }
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
