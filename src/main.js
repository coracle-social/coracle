import "src/app.css"

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

// Analytics
window.plausible = window.plausible || function() { (window.plausible.q = window.plausible.q || []).push(arguments) }

window.addEventListener("beforeinstallprompt", e => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault()

  // Stash the event so it can be triggered later.
  installPrompt.set(e)
})

const {DEFAULT_RELAYS, DUFFLEPUD_URL} = env.get()

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
