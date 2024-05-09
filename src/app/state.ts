import Bugsnag from "@bugsnag/js"
import {uniq} from "ramda"
import {writable} from "@welshman/lib"
import {ConnectionStatus, NetworkContext} from "@welshman/net"
import {userKinds} from "src/util/nostr"
import {router} from "src/app/util/router"
import type {Feed} from "src/domain"
import {
  env,
  relays,
  pubkey,
  session,
  loadSeen,
  loadGroups,
  loadDeletes,
  loadPubkeys,
  loadGiftWrap,
  loadAllMessages,
  getUserRelayUrls,
  listenForNotifications,
  getSetting,
} from "src/engine"

// Global state

export const menuIsOpen = writable(false)

export const searchTerm = writable("")

export const feed = writable<Feed>(null)

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

export const logUsage = async (path: string) => {
  if (getSetting("report_analytics")) {
    const {location, plausible} = window as any
    const pathname = path.replace(/(npub|nprofile|note|nevent|naddr)1[^\/]+/g, (_, m) => `<${m}>`)

    plausible("pageview", {u: location.origin + pathname})
  }
}

export const slowConnections = writable([])

setInterval(() => {
  // Only notify about relays the user is actually subscribed to
  const userRelays = new Set(getUserRelayUrls())
  const $slowConnections = []

  // Prune connections we haven't used in a while, clear errors periodically,
  // and keep track of slow connections
  for (const [url, connection] of NetworkContext.pool.data.entries()) {
    const {lastPublish, lastRequest, lastFault} = connection.meta
    const lastActivity = Math.max(lastPublish, lastRequest)
    const status = connection.meta.getStatus()

    if (lastFault) {
      relays
        .key(url)
        .update($r => ({...$r, faults: uniq(($r.faults || []).concat(lastFault)).slice(-10)}))
    }

    if (lastActivity < Date.now() - 60_000) {
      connection.disconnect()
    } else if (userRelays.has(url) && status === ConnectionStatus.Slow) {
      $slowConnections.push(url)
    }
  }

  // Alert the user to any heinously slow connections
  slowConnections.set($slowConnections)
}, 10_000)

// Synchronization from events to state

export const loadAppData = () => {
  // If we have a group, load that
  if (env.get().FORCE_GROUP) {
    loadGroups([env.get().FORCE_GROUP])
  }
}

export const loadUserData = async () => {
  // Make sure the user and their follows are loaded
  await loadPubkeys([pubkey.get()], {
    force: true,
    kinds: userKinds,
  })

  // Load read receipts
  loadSeen()

  // Load deletes
  loadDeletes()

  // Load settings etc
  loadGiftWrap()

  // Load messages
  loadAllMessages()

  // Start our listener
  listenForNotifications()
}

export const boot = () => router.at("login/connect").open({noEscape: true})
