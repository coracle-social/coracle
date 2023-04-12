import "src/app.css"

import Bugsnag from "@bugsnag/js"
import App from "src/app2/App.svelte"
import {installPrompt} from "src/partials/state"

Bugsnag.start({
  apiKey: "2ea412feabfe14dc9849c6f0b4fa7003",
  collectUserIp: false,
})

window.addEventListener("beforeinstallprompt", e => {
  // Prevent Chrome 67 and earlier from automatically showing the prompt
  e.preventDefault()

  // Stash the event so it can be triggered later.
  installPrompt.set(e)
})

export default new App({
  target: document.getElementById("app"),
})
