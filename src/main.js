import 'src/app.css'

import Bugsnag from "@bugsnag/js"

Bugsnag.start({
  apiKey: "2ea412feabfe14dc9849c6f0b4fa7003",
  collectUserIp: false,
})

import App from 'src/App.svelte'

const app = new App({
  target: document.getElementById('app')
})

export default app
