import Bugsnag from "@bugsnag/js"
import {hash, union} from "hurdak"
import {writable} from "@coracle.social/lib"
import {ConnectionStatus} from "@coracle.social/network"
import {warn} from "src/util/logger"
import {userKinds} from "src/util/nostr"
import {toast} from "src/partials/state"
import {router} from "src/app/router"
import {
  env,
  pool,
  relays,
  pubkey,
  follows,
  session,
  loadSeen,
  loadGroups,
  loadDeletes,
  loadPubkeys,
  loadGiftWrap,
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

export const logUsage = async (path: string) => {
  if (getSetting("report_analytics")) {
    const {location, plausible} = window
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
  for (const [url, connection] of pool.data.entries()) {
    const {lastPublish, lastRequest, lastFault} = connection.meta
    const lastActivity = Math.max(lastPublish, lastRequest)
    const status = connection.meta.getStatus()

    relays.key(url).merge({last_fault: lastFault})

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

export const loadUserData = () => {
  // Make sure the user and their follows are loaded
  loadPubkeys([pubkey.get()], {force: true, kinds: userKinds}).then(() =>
    loadPubkeys(follows.get()),
  )

  // Load read receipts
  loadSeen()

  // Load deletes
  loadDeletes()

  // Load encrypted stuff
  loadGiftWrap()

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
