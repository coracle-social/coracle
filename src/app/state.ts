import Bugsnag from "@bugsnag/js"
import {writable} from "svelte/store"
import {pubkey, session} from "@welshman/app"
import {router} from "src/app/util/router"
import {
  env,
  loadSeen,
  loadGroups,
  loadDeletes,
  loadHandlers,
  loadGiftWraps,
  loadPubkeyUserData,
  loadLegacyMessages,
  loadGroupMessages,
  loadNotifications,
  loadFeedsAndLists,
  listenForNotifications,
  getSetting,
} from "src/engine"

export const drafts = new Map<string, string>()

export const menuIsOpen = writable(false)

export const searchTerm = writable("")

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
  if (env.FORCE_GROUP) {
    loadGroups([env.FORCE_GROUP])
  }
}

export const loadUserData = async () => {
  // Refresh our user's data
  await loadPubkeyUserData([pubkey.get()])

  // Load anything they might need to be notified about
  loadSeen()
  loadGiftWraps()
  loadLegacyMessages()
  loadGroupMessages()
  loadNotifications()
  loadFeedsAndLists()
  loadHandlers()
  loadDeletes()

  // Start listening for notifications
  listenForNotifications()
}

export const boot = () => router.at("login/connect").open({noEscape: true})
