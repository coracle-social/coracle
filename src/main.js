import "src/app.css"
import "@capacitor-community/safe-area"
// Storage registers an app policy, so it has to be imported before anything builds an app
import "src/engine/storage"
import {login, restoreSession} from "src/engine/core"
import {syncAppConfig} from "src/engine/state"
import {toSession, nip01, nip46} from "@welshman/app"
import {Nip46Broker} from "@welshman/signer"
import {makeSecret} from "@welshman/util"
import {App as CapacitorApp} from "@capacitor/app"
import {nsecDecode, nip46Perms} from "src/util/nostr"
import {router} from "src/app/util"
import App from "src/app/App.svelte"
import {installPrompt} from "src/partials/state"

// Nstart login - hash is replaced somewhere else, maybe router?
if (window.location.hash?.startsWith("#nostr-login")) {
  const params = new URLSearchParams(window.location.hash.slice(1))
  const nstartLogin = params.get("nostr-login")

  window.nostrLogin = async () => {
    let success = false

    try {
      if (nstartLogin.startsWith("bunker://")) {
        const clientSecret = makeSecret()
        const {signerPubkey, connectSecret, relays} = Nip46Broker.parseBunkerUrl(nstartLogin)
        const broker = new Nip46Broker({relays, clientSecret, signerPubkey})
        const result = await broker.connect(connectSecret, nip46Perms)
        const pubkey = await broker.getPublicKey()

        // TODO: remove ack result
        if (pubkey && ["ack", connectSecret].includes(result)) {
          // connect() may have switched relays, so persist the broker's current relays.
          await login(toSession(nip46, {clientSecret, signerPubkey, relays: broker.params.relays}))
          success = true
        }

        broker.cleanup()
      } else {
        const secret = nsecDecode(nstartLogin)

        await login(toSession(nip01, {secret}))
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
  }
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

// Sessions hydrate from local storage asynchronously and the app is built lazily around whoever is
// signed in, so nothing may touch it until the last-used account has been restored.
export default restoreSession().then(() => {
  syncAppConfig()

  return new App({
    target: document.getElementById("app"),
  })
})
