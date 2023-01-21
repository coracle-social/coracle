import 'src/app.css'

import Bugsnag from "@bugsnag/js"

Bugsnag.start({apiKey: "2ea412feabfe14dc9849c6f0b4fa7003"})

import App from 'src/App.svelte'

// Annoying global always fails silently. TODO: figure out an eslint rule instead
window.find = null

const app = new App({
  target: document.getElementById('app')
})

export default app
