import Bugsnag from "@bugsnag/js"

export const setupTracking = () => {
  if (!import.meta.env.VITE_BUGSNAG_API_KEY) return

  // Initialize
  Bugsnag.start({
    apiKey: import.meta.env.VITE_BUGSNAG_API_KEY,
    collectUserIp: false,
  })

  // Redact long strings, especially hex and bech32 keys which are 64 and 63
  // characters long, respectively. Put the threshold a little lower in case
  // someone accidentally enters a key with the last few digits missing
  const redactErrorInfo = (info: any) =>
    JSON.parse(
      JSON.stringify(info || null)
        .replace(/\d+:{60}\w+:\w+/g, "[REDACTED]")
        .replace(/\w{60}\w+/g, "[REDACTED]"),
    )

  Bugsnag.addOnError((event: any) => {
    // Redact individual properties since the event needs to be
    // mutated, and we don't want to lose the prototype
    event.context = redactErrorInfo(event.context)
    event.request = redactErrorInfo(event.request)
    event.exceptions = redactErrorInfo(event.exceptions)
    event.breadcrumbs = redactErrorInfo(event.breadcrumbs)

    return true
  })
}
