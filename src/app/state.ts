import Bugsnag from "@bugsnag/js"
import {writable} from "svelte/store"
import {hash, union} from "hurdak"
import {now} from "paravel"
import {warn} from "src/util/logger"
import {userKinds} from "src/util/nostr"
import {toast} from "src/partials/state"
import {router} from "src/app/router"
import {
  pool,
  pubkey,
  session,
  loadDeletes,
  loadPubkeys,
  getUserRelayUrls,
  listenForNotifications,
  getSetting,
  dufflepud,
} from "src/engine"

// Global state

export const menuIsOpen = writable(false)

export const searchTerm = writable("")

// Redact long strings, especially hex and bech32 keys which are 64 and 63
// characters long, respectively. Put the threshold a little lower in case
// someone accidentally enters a key with the last few digits missing
const redactErrorInfo = (info: any) =>
  JSON.parse(JSON.stringify(info || null).replace(/\w{60}\w+/g, "[REDACTED]"))

// Wait for bugsnag to be started in main
setTimeout(() => {
  Bugsnag.addOnError((event: any) => {
    if (window.location.host.startsWith("localhost")) {
      return false
    }

    if (!getSetting("report_analytics")) {
      return false
    }

    // Redact individual properties since the event needs to be
    // mutated, and we don't want to lose the prototype
    event.context = redactErrorInfo(event.context)
    event.request = redactErrorInfo(event.request)
    event.exceptions = redactErrorInfo(event.exceptions)
    event.breadcrumbs = redactErrorInfo(event.breadcrumbs)

    event.setUser(session.get())

    return true
  })
})

const sessionId = Math.random().toString().slice(2)

export const logUsage = async (path: string) => {
  // Hash the user's pubkey so we can identify unique users without knowing
  // anything about them
  const $pubkey = pubkey.get()
  const ident = $pubkey ? hash($pubkey) : "unknown"
  const name = path.replace(/(npub|nprofile|note|nevent)1[^\/]+/g, (_, m) => `<${m}>`)

  if (getSetting("report_analytics")) {
    try {
      await fetch(dufflepud(`usage/${ident}/${sessionId}/${name}`), {method: "post"})
    } catch (e) {
      if (!e.toString().includes("Failed to fetch")) {
        warn(e)
      }
    }
  }
}

export const slowConnections = writable([])

setInterval(() => {
  // Only notify about relays the user is actually subscribed to
  const userRelays = new Set(getUserRelayUrls())
  const $slowConnections = []

  // Prune connections we haven't used in a while, clear errors periodically,
  // and keep track of slow connections
  for (const [url, connection] of pool.data.entries()) {
    if (connection.meta.last_activity < now() - 60) {
      connection.disconnect()
    } else if (connection.lastError < Date.now() - 10_000) {
      connection.clearError()
    } else if (userRelays.has(url) && connection.meta.quality < 0.3) {
      $slowConnections.push(url)
    }
  }

  // Alert the user to any heinously slow connections
  slowConnections.set($slowConnections)
}, 10_000)

// Synchronization from events to state

export const loadAppData = () => {
  // Make sure the user is loaded
  loadPubkeys([pubkey.get()], {force: true, kinds: userKinds})

  // Load deletes
  loadDeletes()

  // Start our listener
  listenForNotifications()
}

export const boot = () => router.at("login/connect").open({noEscape: true})

export const toastProgress = progress => {
  const {event, succeeded, failed, timeouts, completed, pending} = progress
  const relays = Array.from(union(completed, pending))

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

  const payload = pending.size
    ? message
    : {
        text: message,
        link: {
          text: "Details",
          onClick: () =>
            router.at("notes").of(event.id, {relays}).at("status").cx({event, progress}).open(),
        },
      }

  toast.show("info", payload, pending.size ? null : 8)
}
