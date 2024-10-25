import * as Sentry from "@sentry/browser"

export const setupTracking = () => {
  if (import.meta.env.VITE_SENTRY_DSN) {
    Sentry.init({
      dsn: import.meta.env.VITE_SENTRY_DSN,
      tracesSampleRate: 0.01,
      integrations(integrations) {
        return integrations.filter(integration => integration.name !== 'Breadcrumbs')
      },
    })
  }
}
