import {prop, assoc, max, sortBy} from "ramda"
import {seconds} from "hurdak"
import {now, Tags} from "paravel"
import {reactionKinds, getParentId} from "src/util/nostr"
import {tryJson} from "src/util/misc"
import {events, isEventMuted} from "src/engine/events/derived"
import {derived} from "src/engine/core/utils"
import {groupRequests, groupAdminKeys, groupAlerts} from "src/engine/groups/state"
import {pubkey} from "src/engine/session/state"
import {session} from "src/engine/session/derived"
import {userEvents} from "src/engine/events/derived"

export const notifications = derived(
  [pubkey, userEvents.mapStore.throttle(500), events.throttle(500)],
  ([$pubkey, $userEvents, $events]) => {
    if (!$pubkey) {
      return []
    }

    const $isEventMuted = isEventMuted.get()

    return $events.filter(e => {
      if (e.pubkey === $pubkey || $isEventMuted(e)) {
        return false
      }

      return $userEvents.get(getParentId(e, "e")) || Tags.from(e).pubkeys().has($pubkey)
    })
  },
)

export const otherNotifications = derived(
  [groupRequests, groupAlerts, groupAdminKeys],
  ([$requests, $alerts, $adminKeys]) => {
    const adminPubkeys = new Set($adminKeys.map(k => k.pubkey))

    return sortBy(
      n => -n.created_at,
      [
        ...$requests.filter(r => !r.resolved).map(assoc("t", "request")),
        ...$alerts.filter(a => !adminPubkeys.has(a.pubkey)).map(assoc("t", "alert")),
      ],
    )
  },
)

export const hasNewNotifications = derived(
  [session, notifications, otherNotifications],
  ([$session, $notifications, $otherNotifications]) => {
    const maxCreatedAt = $notifications
      .filter(e => !reactionKinds.includes(e.kind))
      .concat($otherNotifications)
      .map(prop("created_at"))
      .reduce(max, 0)

    return maxCreatedAt > ($session?.notifications_last_synced || 0)
  },
)

export const groupNotifications = ($notifications, kinds) => {
  const $userEvents = userEvents.mapStore.get()

  // Convert zaps to zap requests
  const convertZap = e => {
    if (e.kind === 9735) {
      return tryJson(() => JSON.parse(Tags.from(e).getDict().description as string))
    }

    return e
  }

  const groups = {}

  // Group notifications by event
  for (const ix of $notifications) {
    const parentId = getParentId(ix, "e")
    const event = $userEvents.get(parentId)

    if (!kinds.includes(ix.kind)) {
      continue
    }

    if (reactionKinds.includes(ix.kind) && !event) {
      continue
    }

    // Group and sort by day/event so we can group clustered reactions to the same event
    const delta = now() - ix.created_at
    const deltaDisplay = Math.round(delta / seconds(3, "hour")).toString()
    const key = deltaDisplay + (parentId || `self:${ix.id}`)

    groups[key] = groups[key] || {key, event, interactions: []}
    groups[key].interactions.push(convertZap(ix))
  }

  return sortBy(
    g => -g.timestamp,
    Object.values(groups).map((group: any) => {
      const {event, interactions} = group
      const timestamp = interactions
        .map(e => e.created_at)
        .concat(event?.created_at || 0)
        .reduce(max, 0)

      return {...group, timestamp}
    }),
  )
}
