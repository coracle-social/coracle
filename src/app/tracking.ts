import * as Sentry from "@sentry/browser"

export const setupTracking = () => {
  if (import.meta.env.VITE_GLITCHTIP_API_KEY) {
    Sentry.init({
      dsn: import.meta.env.VITE_GLITCHTIP_API_KEY,
      tracesSampleRate: 0.01,
      integrations(integrations) {
        return integrations.filter(integration => integration.name !== "Breadcrumbs")
      },
    })
  }
}
