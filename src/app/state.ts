import type {Filter} from "nostr-tools"
import type {DynamicFilter} from "src/engine/types"
import Bugsnag from "@bugsnag/js"
import {nip19} from "nostr-tools"
import {navigate} from "svelte-routing"
import {writable, get} from "svelte/store"
import {whereEq, omit, filter, pluck, sortBy, slice} from "ramda"
import {doPipe, first} from "hurdak/lib/hurdak"
import {warn} from "src/util/logger"
import {hash, timedelta, now, batch, shuffle, sleep, clamp} from "src/util/misc"
import {userKinds, noteKinds} from "src/util/nostr"
import {modal, toast} from "src/partials/state"
import {
  FORCE_RELAYS,
  DEFAULT_FOLLOWS,
  ENABLE_ZAPS,
  pubkeyLoader,
  alerts,
  events,
  nip28,
  meta,
  network,
  outbox,
  user,
  keys,
} from "src/app/engine"

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

    if (!user.getSetting("report_analytics")) {
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
  const pubkey = keys.pubkey.get()
  const ident = pubkey ? hash(pubkey) : "unknown"

  if (user.getSetting("report_analytics")) {
    try {
      await fetch(user.dufflepud(`usage/${ident}/${session}/${name}`), {method: "post"})
    } catch (e) {
      if (!e.toString().includes("Failed to fetch")) {
        warn(e)
      }
    }
  }
}

// Synchronization from events to state

export const listen = async () => {
  const pubkey = keys.pubkey.get()
  const kinds = noteKinds.concat([4, 7])

  if (ENABLE_ZAPS) {
    kinds.push(9735)
  }

  // Only grab notifications since we last checked, with some wiggle room
  const since =
    clamp([now() - timedelta(30, "days"), now()], get(alerts.latestNotification)) -
    timedelta(1, "days")

  const channelIds = pluck("id", nip28.channels.get().filter(whereEq({joined: true})))

  const eventIds = doPipe(events.cache.get(), [
    filter(e => e.kind === 1 && e.created_at > now() - timedelta(30, "days")),
    sortBy(e => -e.created_at),
    slice(0, 256),
    pluck("id"),
  ])

  ;(listen as any)._listener?.unsub()
  ;(listen as any)._listener = await network.subscribe({
    relays: user.getRelayUrls("read"),
    filter: [
      {kinds: noteKinds.concat(4), authors: [pubkey], since, limit: 1},
      {kinds, "#p": [pubkey], since, limit: 1},
      {kinds, "#e": eventIds, since, limit: 1},
      {kinds: [42], "#e": channelIds, since},
    ],
    onEvent: batch(3000, events => {
      pubkeyLoader.load(pluck("pubkey", events))
    }),
  })
}

export const slowConnections = writable([])

setInterval(() => {
  // Only notify about relays the user is actually subscribed to
  const userRelays = new Set(user.getRelayUrls())
  const $slowConnections = []

  // Prune connections we haven't used in a while
  for (const url of network.pool.data.keys()) {
    const stats = meta.getRelayStats(url)

    if (!stats) {
      continue
    }

    if (stats.last_activity < now() - 60) {
      network.pool.remove(url)
    } else if (userRelays.has(url) && first(meta.getRelayQuality(url)) < 0.3) {
      $slowConnections.push(url)
    }
  }

  // Alert the user to any heinously slow connections
  slowConnections.set($slowConnections)
}, 10_000)

export const loadAppData = async pubkey => {
  if (user.getRelayUrls("read").length > 0) {
    // Start our listener, but don't wait for it
    listen()

    // Make sure the user and their network is loaded
    pubkeyLoader.load([pubkey], {force: true, kinds: userKinds})
    pubkeyLoader.load(user.getFollows())
  }
}

export const login = async (method, key) => {
  keys.login(method, key)

  if (FORCE_RELAYS.length > 0) {
    modal.replace({
      type: "message",
      message: "Logging you in...",
      spinner: true,
      noEscape: true,
    })

    await Promise.all([
      sleep(1500),
      pubkeyLoader.load([keys.pubkey.get()], {force: true, kinds: userKinds}),
    ])

    navigate("/notes")
  } else {
    modal.push({type: "login/connect", noEscape: true})
  }
}

export const publishWithToast = (event, relays) =>
  outbox.publish(event, relays, ({completed, succeeded, failed, timeouts, pending}) => {
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
    filter = {...filter, authors: getAuthors(user.getFollows())}
  } else if (filter.authors === "network") {
    filter = {...filter, authors: getAuthors(user.getNetwork())}
  }

  return filter
}
