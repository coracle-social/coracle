import "src/app.css"

import {identity} from "ramda"
import {Fetch} from "hurdak"
import {normalizeRelayUrl} from "paravel"
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

const fromCsv = s => (s || "").split(",").filter(identity)

const CLIENT_ID = import.meta.env.VITE_CLIENT_ID

const CLIENT_NAME = import.meta.env.VITE_CLIENT_NAME

const IMGPROXY_URL = import.meta.env.VITE_IMGPROXY_URL

const DUFFLEPUD_URL = import.meta.env.VITE_DUFFLEPUD_URL

const MULTIPLEXTR_URL = import.meta.env.VITE_MULTIPLEXTR_URL

const NIP96_URLS = fromCsv(import.meta.env.VITE_NIP96_URLS)

const FORCE_GROUP = import.meta.env.VITE_FORCE_GROUP

const FORCE_RELAYS = fromCsv(import.meta.env.VITE_FORCE_RELAYS).map(normalizeRelayUrl)

const DVM_RELAYS = fromCsv(import.meta.env.VITE_DVM_RELAYS).map(normalizeRelayUrl)

const SEARCH_RELAYS = fromCsv(import.meta.env.VITE_SEARCH_RELAYS).map(normalizeRelayUrl)

const DEFAULT_RELAYS = fromCsv(import.meta.env.VITE_DEFAULT_RELAYS).map(normalizeRelayUrl)

const DEFAULT_FOLLOWS = fromCsv(import.meta.env.VITE_DEFAULT_FOLLOWS)

const ONBOARDING_LISTS = fromCsv(import.meta.env.VITE_ONBOARDING_LISTS)

const ENABLE_ZAPS = JSON.parse(import.meta.env.VITE_ENABLE_ZAPS)

// Prep our env
env.set({
  CLIENT_ID,
  CLIENT_NAME,
  ONBOARDING_LISTS,
  DEFAULT_FOLLOWS,
  NIP96_URLS,
  IMGPROXY_URL,
  DUFFLEPUD_URL,
  MULTIPLEXTR_URL,
  FORCE_GROUP,
  FORCE_RELAYS,
  DVM_RELAYS,
  SEARCH_RELAYS,
  DEFAULT_RELAYS,
  ENABLE_ZAPS,
})

// Throw some hardcoded defaults in there
DEFAULT_RELAYS.forEach(saveRelay)

// Load relays from nostr.watch via dufflepud
if (DUFFLEPUD_URL) {
  setTimeout(() => {
    tryFetch(async () => {
      const json = await Fetch.fetchJson(DUFFLEPUD_URL + "/relay")

      json.relays.forEach(saveRelay)
    })
  }, 3000)
}

export default new App({
  target: document.getElementById("app"),
})
