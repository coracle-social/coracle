import type {Filter} from "nostr-tools"
import type {DisplayEvent, DynamicFilter} from "src/util/types"
import Bugsnag from "@bugsnag/js"
import {nip19} from "nostr-tools"
import {navigate} from "svelte-routing"
import {writable, get} from "svelte/store"
import {omit, pluck, sortBy, slice} from "ramda"
import {createMap, doPipe, first} from "hurdak/lib/hurdak"
import {warn} from "src/util/logger"
import {hash, shuffle, sleep, clamp} from "src/util/misc"
import {now, timedelta} from "src/util/misc"
import {userKinds, noteKinds} from "src/util/nostr"
import {findReplyId} from "src/util/nostr"
import {modal, toast} from "src/partials/state"
import {
  DEFAULT_FOLLOWS,
  ENABLE_ZAPS,
  keys,
  social,
  routing,
  alerts,
  settings,
  cache,
  chat,
} from "src/system"
import network from "src/agent/network"
import pool from "src/agent/pool"

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

    if (!settings.getSetting("reportAnalytics")) {
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
  const pubkey = keys.getPubkey()
  const ident = pubkey ? hash(pubkey) : "unknown"
  const {dufflepudUrl, reportAnalytics} = settings.getSettings()

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

// Synchronization from events to state

export const listen = async () => {
  const pubkey = keys.getPubkey()
  const kinds = noteKinds.concat([4, 7])

  if (ENABLE_ZAPS) {
    kinds.push(9735)
  }

  // Only grab notifications since we last checked, with some wiggle room
  const since =
    clamp([now() - timedelta(30, "days"), now()], get(alerts.latestNotification)) -
    timedelta(1, "days")

  const channelIds = pluck("id", chat.channels.all({joined: true}))

  const eventIds = doPipe(cache.events, [
    t => t.all({kind: 1, created_at: {$gt: now() - timedelta(30, "days")}}),
    sortBy(e => -e.created_at),
    slice(0, 256),
    pluck("id"),
  ])

  ;(listen as any)._listener?.unsub()
  ;(listen as any)._listener = await network.listen({
    relays: routing.getUserRelayUrls("read"),
    filter: [
      {kinds: noteKinds.concat(4), authors: [pubkey], since},
      {kinds, "#p": [pubkey], since},
      {kinds, "#e": eventIds, since},
      {kinds: [42], "#e": channelIds, since},
    ],
    onChunk: async events => {
      await network.loadPeople(pluck("pubkey", events))
    },
  })
}

export const slowConnections = writable([])

setInterval(() => {
  // Only notify about relays the user is actually subscribed to
  const relays = new Set(routing.getUserRelayUrls())

  // Prune connections we haven't used in a while
  Object.entries(pool.Meta.stats)
    .filter(([url, stats]) => stats.lastRequest < Date.now() - 60_000)
    .forEach(([url, stats]) => pool.disconnect(url))

  // Alert the user to any heinously slow connections
  slowConnections.set(
    Object.keys(pool.Meta.stats).filter(url => relays.has(url) && first(pool.getQuality(url)) < 0.3)
  )
}, 30_000)

export const loadAppData = async pubkey => {
  if (routing.getUserRelayUrls("read").length > 0) {
    // Start our listener, but don't wait for it
    listen()

    // Make sure the user and their network is loaded
    await network.loadPeople([pubkey], {force: true, kinds: userKinds})
    await network.loadPeople(social.getUserFollows())
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
      network.loadPeople([keys.getPubkey()], {force: true, kinds: userKinds}),
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

// Feeds

export const compileFilter = (filter: DynamicFilter): Filter => {
  const getAuthors = pubkeys =>
    shuffle(pubkeys.length > 0 ? pubkeys : DEFAULT_FOLLOWS).slice(0, 256)

  if (filter.authors === "global") {
    filter = omit(["authors"], filter)
  } else if (filter.authors === "follows") {
    filter = {...filter, authors: getAuthors(social.getUserFollows())}
  } else if (filter.authors === "network") {
    filter = {...filter, authors: getAuthors(social.getUserNetwork())}
  }

  return filter
}
