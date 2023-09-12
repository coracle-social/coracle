import {reduce} from "ramda"
import {derived} from "src/engine2/util"
import {alerts, alertsLastChecked} from "src/engine2/state"

export const latestNotification = alerts.derived(reduce((n, e) => Math.max(n, e.created_at), 0))

export const hasNewNotfications = derived(
  [alertsLastChecked, latestNotification],
  ([c, n]) => n > c
)
