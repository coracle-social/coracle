import 'src/app.css'

import Bugsnag from "@bugsnag/js"
import App from 'src/App.svelte'

// Annoying global always fails silently. Figure out an eslint rule instead
window.find = null

Bugsnag.start({apiKey: "2ea412feabfe14dc9849c6f0b4fa7003"})

const app = new App({
  target: document.getElementById('app')
})

export default app
