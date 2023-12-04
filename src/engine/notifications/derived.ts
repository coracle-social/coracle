import {prop, max, sortBy} from "ramda"
import {seconds} from "hurdak"
import {now, Tags} from "paravel"
import {reactionKinds} from "src/util/nostr"
import {tryJson} from "src/util/misc"
import {events, isEventMuted} from "src/engine/events/derived"
import {derived} from "src/engine/core/utils"
import {groupRequests, groupAlerts} from "src/engine/groups/state"
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

      const tags = Tags.from(e)

      return (
        $userEvents.get(tags.getRoot("e")) ||
        $userEvents.get(tags.getRoot("a")) ||
        tags.pubkeys().has($pubkey)
      )
    })
  },
)

export const otherNotifications = derived([groupRequests, groupAlerts], ([$requests, $alerts]) =>
  sortBy(
    n => -n.created_at,
    [
      ...$requests.filter(r => !r.resolved).map(request => ({t: "request", ...request})),
      ...$alerts.map(alert => ({t: "alert", ...alert})),
    ],
  ),
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
    const parentId = Tags.from(ix).getReply()
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
