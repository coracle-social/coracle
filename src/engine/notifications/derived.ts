import {assoc, without, max, sortBy} from "ramda"
import {seconds} from "hurdak"
import {now} from "@coracle.social/lib"
import {Tags} from "@coracle.social/util"
import {isLike, reactionKinds, noteKinds, repostKinds} from "src/util/nostr"
import {tryJson} from "src/util/misc"
import {isSeen} from "src/engine/events/derived"
import {deletes} from "src/engine/events/state"
import {unwrapRepost} from "src/engine/events/utils"
import {events, isEventMuted} from "src/engine/events/derived"
import {derived} from "src/engine/core/utils"
import {groupRequests, groupAdminKeys, groupAlerts} from "src/engine/groups/state"
import {getUserCircles} from "src/engine/groups/utils"
import {pubkey} from "src/engine/session/state"
import {session} from "src/engine/session/derived"
import {userEvents} from "src/engine/events/derived"
import {OnboardingTask} from "./model"

export const notifications = derived(
  [pubkey, userEvents.mapStore.throttle(500), events.throttle(500)],
  ([$pubkey, $userEvents, $events]) => {
    if (!$pubkey) {
      return []
    }

    const $isEventMuted = isEventMuted.get()
    const kinds = [...noteKinds, ...reactionKinds]

    return $events.filter(e => {
      if (e.pubkey === $pubkey || $isEventMuted(e) || !kinds.includes(e.kind)) {
        return false
      }

      if (e.kind === 7 && !isLike(e)) {
        return false
      }

      const tags = Tags.fromEvent(e)

      return $userEvents.get(tags.whereKey("e").parent()?.value()) || tags.values("p").has($pubkey)
    })
  },
)

export const unreadNotifications = derived([isSeen, notifications], ([$isSeen, $notifications]) => {
  const since = now() - seconds(30, "day")

  return $notifications.filter(
    e => !reactionKinds.includes(e.kind) && e.created_at > since && !$isSeen(e),
  )
})

export const groupNotifications = derived(
  [session, events, deletes, groupRequests, groupAlerts, groupAdminKeys],
  x => x,
)
  .throttle(3000)
  .derived(([$session, $events, $deletes, $requests, $alerts, $adminKeys, $addresses]) => {
    const addresses = new Set(getUserCircles($session))
    const adminPubkeys = new Set($adminKeys.map(k => k.pubkey))
    const $isEventMuted = isEventMuted.get()

    const shouldSkip = e => {
      const tags = Tags.fromEvent(e)
      const context = tags.context().values().valueOf()

      return (
        !context.some(a => addresses.has(a)) ||
        context.some(a => $deletes.has(a)) ||
        !noteKinds.includes(e.kind) ||
        e.pubkey === $session.pubkey ||
        // Skip mentions since they're covered in normal notifications
        tags.values("p").has($session.pubkey) ||
        $isEventMuted(e)
      )
    }

    return sortBy(
      x => -x.created_at,
      [
        ...$requests.filter(r => !r.resolved && !$deletes.has(r.group)).map(assoc("t", "request")),
        ...$alerts
          .filter(a => !adminPubkeys.has(a.pubkey) && !$deletes.has(a.group))
          .map(assoc("t", "alert")),
        ...$events
          .map(e => (repostKinds.includes(e.kind) ? unwrapRepost(e) : e))
          .filter(e => e && !shouldSkip(e)),
      ],
    )
  })

export const unreadGroupNotifications = derived(
  [isSeen, groupNotifications],
  ([$isSeen, $groupNotifications]) => {
    const since = now() - seconds(30, "day")

    return $groupNotifications.filter(e => e.created_at > since && !$isSeen(e))
  },
)

export const unreadCombinedNotifications = derived(
  [unreadNotifications, unreadGroupNotifications],
  ([$unreadNotifications, $unreadGroupNotifications]) =>
    $unreadNotifications.concat($unreadGroupNotifications),
)

export const hasNewNotifications = derived(
  [session, unreadCombinedNotifications],
  ([$session, $unread]) => {
    if ($unread.length > 0) {
      return true
    }

    if ($session?.onboarding_tasks_completed) {
      return without($session.onboarding_tasks_completed, Object.values(OnboardingTask)).length > 0
    }

    return false
  },
)

export const createNotificationGroups = ($notifications, kinds) => {
  const $userEvents = userEvents.mapStore.get()

  // Convert zaps to zap requests
  const convertZap = e => {
    if (e.kind === 9735) {
      return tryJson(() => JSON.parse(Tags.fromEvent(e).get("description")?.value()))
    }

    return e
  }

  const groups = {}

  // Group notifications by event
  for (const ix of $notifications) {
    const parentId = Tags.fromEvent(ix).whereKey("e").parent()?.value()
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
