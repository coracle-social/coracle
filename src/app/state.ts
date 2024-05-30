import Bugsnag from "@bugsnag/js"
import {writable} from "@welshman/lib"
import {Scope, makeScopeFeed} from "@welshman/feeds"
import {router} from "src/app/util/router"
import type {Feed} from "src/domain"
import {makeFeed} from "src/domain"
import {
  env,
  pubkey,
  session,
  loadSeen,
  loadGroups,
  loadLabels,
  loadDeletes,
  loadHandlers,
  loadPubkeyUserData,
  loadGiftWrap,
  loadAllMessages,
  loadGroupMessages,
  loadNotifications,
  listenForNotifications,
  getSetting,
} from "src/engine"

// Global state

export const drafts = new Map<string, string>()

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
  JSON.parse(
    JSON.stringify(info || null)
      .replace(/\d+:{60}\w+:\w+/g, "[REDACTED]")
      .replace(/\w{60}\w+/g, "[REDACTED]"),
  )

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

// Synchronization from events to state

export const loadAppData = () => {
  // If we have a group, load that
  if (env.get().FORCE_GROUP) {
    loadGroups([env.get().FORCE_GROUP])
  }
}

export const loadUserData = async () => {
  // Make sure the user and their follows are loaded
  await loadPubkeyUserData([pubkey.get()])

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
