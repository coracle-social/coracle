import {assoc, max, sortBy} from "ramda"
import {seconds} from "hurdak"
import {now, Tags} from "paravel"
import {reactionKinds, isGiftWrap, getParentId} from "src/util/nostr"
import {tryJson} from "src/util/misc"
import {seenIds} from "src/engine/events/state"
import {events, isEventMuted} from "src/engine/events/derived"
import {derived} from "src/engine/core/utils"
import {groupRequests, groupAdminKeys, groupAlerts} from "src/engine/groups/state"
import {pubkey} from "src/engine/session/state"
import {userEvents} from "src/engine/events/derived"

export const notifications = derived(
  [pubkey, userEvents.mapStore.throttle(500), events.throttle(500)],
  ([$pubkey, $userEvents, $events]) => {
    if (!$pubkey) {
      return []
    }

    const $isEventMuted = isEventMuted.get()

    return $events.filter(e => {
      if (e.pubkey === $pubkey || $isEventMuted(e) || isGiftWrap(e)) {
        return false
      }

      return $userEvents.get(getParentId(e, "e")) || Tags.from(e).pubkeys().has($pubkey)
    })
  },
)

export const unreadNotifications = derived(
  [seenIds, notifications],
  ([$seenIds, $notifications]) => {
    const since = now() - seconds(30, "day")

    return $notifications.filter(
      e => !reactionKinds.includes(e.kind) && e.created_at > since && !$seenIds.has(e.id),
    )
  },
)

export const groupNotifications = derived(
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

export const unreadGroupNotifications = derived(
  [seenIds, groupNotifications],
  ([$seenIds, $groupNotifications]) => {
    const since = now() - seconds(30, "day")

    return $groupNotifications.filter(e => e.created_at > since && !$seenIds.has(e.id))
  },
)

export const unreadCombinedNotifications = derived(
  [unreadNotifications, unreadGroupNotifications],
  ([$unreadNotifications, $unreadGroupNotifications]) =>
    $unreadNotifications.concat($unreadGroupNotifications),
)

export const hasNewNotifications = unreadCombinedNotifications.derived($n => $n.length > 0)

export const createNotificationGroups = ($notifications, kinds) => {
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
