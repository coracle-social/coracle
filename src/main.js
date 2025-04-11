import "src/app.css"
import * as Sentry from "@sentry/browser"
import {loginWithNip01, loginWithNip46, nip46Perms} from "@welshman/app"
import {makeSecret, Nip46Broker} from "@welshman/signer"
import {App as CapacitorApp} from "@capacitor/app"
import {nsecDecode} from "src/util/nostr"
import {router} from "src/app/util"
import App from "src/app/App.svelte"
import {installPrompt} from "src/partials/state"

// Nstart login - hash is replaced somewhere else, maybe router?
if (window.location.hash?.startsWith("#nostr-login")) {
  ;(async () => {
    const params = new URLSearchParams(window.location.hash.slice(1))
    const login = params.get("nostr-login")

    let success = false

    try {
      if (login.startsWith("bunker://")) {
        const clientSecret = makeSecret()
        const {signerPubkey, connectSecret, relays} = Nip46Broker.parseBunkerUrl(login)
        const broker = Nip46Broker.get({relays, clientSecret, signerPubkey})
        const result = await broker.connect(connectSecret, nip46Perms)
        const pubkey = await broker.getPublicKey()

        // TODO: remove ack result
        if (pubkey && ["ack", connectSecret].includes(result)) {
          loginWithNip46(pubkey, clientSecret, signerPubkey, relays)
          success = true
        }
      } else {
        const secret = nsecDecode(login)

        loginWithNip01(secret)
        success = true
      }
    } catch (e) {
      console.error(e)
    }

    if (success) {
      setTimeout(
        () => router.at("/signup").cx({stage: "follows", nstartCompleted: true}).open(),
        300,
      )
    }
  })()
}

if (import.meta.env.VITE_GLITCHTIP_API_KEY) {
  Sentry.init({
    dsn: import.meta.env.VITE_GLITCHTIP_API_KEY,
    tracesSampleRate: 0.01,
    integrations(integrations) {
      return integrations.filter(integration => integration.name !== "Breadcrumbs")
    },
  })
}

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

// Handle back button on android
CapacitorApp.addListener("backButton", ({canGoBack}) => {
  if (!canGoBack) {
    CapacitorApp.exitApp()
  } else {
    window.history.back()
  }
})

export default new App({
  target: document.getElementById("app"),
})
