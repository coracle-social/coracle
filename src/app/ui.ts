import Bugsnag from "@bugsnag/js"
import {nip19} from "nostr-tools"
import {writable} from "svelte/store"
import {hash} from "src/util/misc"
import {warn} from "src/util/logger"
import user from "src/agent/user"

// Routing

export const routes = {
  person: (pubkey, tab = "notes") => `/people/${nip19.npubEncode(pubkey)}/${tab}`,
}

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
