import "src/app.css"

import Bugsnag from "@bugsnag/js"
import App from "src/app/App.svelte"
import {installPrompt} from "src/partials/state"

if (import.meta.env.VITE_BUGSNAG_API_KEY) {
  Bugsnag.start({
    apiKey: import.meta.env.VITE_BUGSNAG_API_KEY,
    collectUserIp: false,
  })
}

// Migrate sessions

const sessions = {}

for (const [key, {privkey, connectKey, connectToken, connectHandler, ...session}] of Object.entries(
  getJson("sessions") || {},
)) {
  if (session.method === "extension") {
    sessions[key] = session
  } else if (session.method === "privkey") {
    sessions[key] = {...session, secret: privkey}
  } else if (session.method === "connect") {
    sessions[key] = {
      ...session,
      method: "nip46",
      secret: connectKey,
      token: connectToken,
      handler: connectHandler,
    }
  }
}

setJson("sessions", sessions)

// Analytics
window.plausible =
  window.plausible ||
  function () {
    ;(window.plausible.q = window.plausible.q || []).push(arguments)
  }

window.addEventListener("beforeinstallprompt", e => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault()

  // Stash the event so it can be triggered later.
  installPrompt.set(e)
})

export default new App({
  target: document.getElementById("app"),
})
