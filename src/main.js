import "src/app.css"

import {identity} from "ramda"
import {Fetch} from "hurdak"
import Bugsnag from "@bugsnag/js"
import {tryFetch} from "src/util/misc"
import {env, saveRelay} from "src/engine"
import App from "src/app/App.svelte"
import {installPrompt} from "src/partials/state"

if (import.meta.env.VITE_BUGSNAG_API_KEY) {
  Bugsnag.start({
    apiKey: import.meta.env.VITE_BUGSNAG_API_KEY,
    collectUserIp: false,
  })
}

window.addEventListener("beforeinstallprompt", e => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault()

  // Stash the event so it can be triggered later.
  installPrompt.set(e)
})

const IMGPROXY_URL = import.meta.env.VITE_IMGPROXY_URL

const DUFFLEPUD_URL = import.meta.env.VITE_DUFFLEPUD_URL

const MULTIPLEXTR_URL = import.meta.env.VITE_MULTIPLEXTR_URL

const FORCE_RELAYS = (import.meta.env.VITE_FORCE_RELAYS || "").split(",").filter(identity)

const COUNT_RELAYS = FORCE_RELAYS.length > 0 ? FORCE_RELAYS : ["wss://rbr.bio"]

const SEARCH_RELAYS = FORCE_RELAYS.length > 0 ? FORCE_RELAYS : ["wss://relay.nostr.band"]

const DEFAULT_RELAYS =
  FORCE_RELAYS.length > 0
    ? FORCE_RELAYS
    : [
        "wss://purplepag.es",
        "wss://relay.damus.io",
        "wss://relay.nostr.band",
        "wss://relayable.org",
        "wss://nostr.wine",
      ]

const DEFAULT_FOLLOWS = (import.meta.env.VITE_DEFAULT_FOLLOWS || "").split(",").filter(identity)

const ENABLE_ZAPS = JSON.parse(import.meta.env.VITE_ENABLE_ZAPS)

// Prep our env
env.set({
  DEFAULT_FOLLOWS,
  IMGPROXY_URL,
  DUFFLEPUD_URL,
  MULTIPLEXTR_URL,
  FORCE_RELAYS,
  COUNT_RELAYS,
  SEARCH_RELAYS,
  DEFAULT_RELAYS,
  ENABLE_ZAPS,
})

// Throw some hardcoded defaults in there
DEFAULT_RELAYS.forEach(saveRelay)

// Load relays from nostr.watch via dufflepud
if (FORCE_RELAYS.length === 0 && DUFFLEPUD_URL) {
  tryFetch(async () => {
    const json = await Fetch.fetchJson(DUFFLEPUD_URL + "/relay")

    json.relays.forEach(saveRelay)
  })
}

export default new App({
  target: document.getElementById("app"),
})
