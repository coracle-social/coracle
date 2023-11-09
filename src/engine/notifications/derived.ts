import {prop, max, sortBy} from "ramda"
import {seconds} from "hurdak"
import {now, Tags} from "paravel"
import {reactionKinds} from "src/util/nostr"
import {tryJson} from "src/util/misc"
import {events, isEventMuted} from "src/engine/events/derived"
import {derived} from "src/engine/core/utils"
import {session} from "src/engine/session/derived"
import {userEvents} from "src/engine/events/derived"

export const notifications = derived(
  [session, userEvents.mapStore.throttle(500), events.throttle(500)],
  ([$session, $userEvents, $events]) => {
    if (!$session) {
      return []
    }

    const $isEventMuted = isEventMuted.get()

    return $events.filter(e => {
      if (e.pubkey === $session.pubkey || $isEventMuted(e)) {
        return false
      }

      const tags = Tags.from(e).normalize()

      return (
        $userEvents.get(tags.mark("root").getValue()) ||
        $userEvents.get(tags.mark("reply").getValue()) ||
        tags.pubkeys().has($session.pubkey)
      )
    })
  }
)

export const hasNewNotifications = derived(
  [session, notifications],
  ([$session, $notifications]) => {
    const maxCreatedAt = $notifications
      .filter(e => !reactionKinds.includes(e.kind))
      .map(prop("created_at"))
      .reduce(max, 0)

    return maxCreatedAt > ($session?.notifications_last_synced || 0)
  }
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
    })
  )
}
