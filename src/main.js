import "src/app.css"
import * as Sentry from '@sentry/browser'
import {App as CapacitorApp} from "@capacitor/app"
import App from "src/app/App.svelte"
import {installPrompt} from "src/partials/state"

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    tracesSampleRate: 0.01,
    integrations(integrations) {
      return integrations.filter(integration => integration.name !== 'Breadcrumbs')
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
