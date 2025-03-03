import * as Sentry from "@sentry/browser"
import {getSetting} from "@app/state"

export const setupTracking = () => {
  if (import.meta.env.VITE_GLITCHTIP_API_KEY) {
    Sentry.init({
      dsn: import.meta.env.VITE_GLITCHTIP_API_KEY,
      beforeSend(event: any) {
        if (!getSetting("report_errors")) {
          return null
        }

        return event
      },
      integrations(integrations) {
        return integrations.filter(integration => integration.name !== "Breadcrumbs")
      },
    })
  }
}
