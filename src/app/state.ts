import Bugsnag from "@bugsnag/js"
import {uniq} from "ramda"
import {writable} from "@welshman/lib"
import {makeScopeFeed, Scope} from "@welshman/feeds"
import {NetworkContext} from "@welshman/net"
import {userKinds} from "src/util/nostr"
import {router} from "src/app/util/router"
import type {Feed} from "src/domain"
import {makeFeed} from "src/domain"
import {
  env,
  hints,
  relays,
  pubkey,
  session,
  loadSeen,
  loadGroups,
  loadLabels,
  loadDeletes,
  loadHandlers,
  loadPubkeys,
  loadGiftWrap,
  loadAllMessages,
  getUserRelayUrls,
  loadGroupMessages,
  loadNotifications,
  listenForNotifications,
  getSetting,
} from "src/engine"

// Global state

export const menuIsOpen = writable(false)

export const searchTerm = writable("")

export const globalFeed = writable<Feed>(
  makeFeed({
    definition: makeScopeFeed(Scope.Follows),
  }),
)

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
  slowConnections.set(getUserRelayUrls().filter(url => hints.options.getRelayQuality(url) < 0.5))

  // Prune connections we haven't used in a while. Clear errors periodically
  for (const [url, connection] of NetworkContext.pool.data.entries()) {
    const {lastPublish, lastRequest, lastFault} = connection.meta
    const lastActivity = Math.max(lastPublish, lastRequest)

    if (lastFault) {
      relays
        .key(url)
        .update($r => ({...$r, faults: uniq(($r.faults || []).concat(lastFault)).slice(-10)}))
    }

    if (lastActivity < Date.now() - 60_000) {
      connection.disconnect()
    }
  }
}, 5_000)

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

  loadSeen()
  loadLabels()
  loadDeletes()
  loadHandlers()
  loadGiftWrap()
  loadAllMessages()
  loadGroupMessages()
  loadNotifications()
  listenForNotifications()
}

export const boot = () => router.at("login/connect").open({noEscape: true})
