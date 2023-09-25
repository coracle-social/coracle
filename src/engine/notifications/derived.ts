import {prop, max, sortBy} from "ramda"
import {Tags, reactionKinds, findReplyId, findReplyAndRootIds} from "src/util/nostr"
import {formatTimestampAsLocalISODate, tryJson} from "src/util/misc"
import {events} from "src/engine/events/derived"
import {derived} from "src/engine/core/utils"
import {isEventMuted} from "src/engine/people/utils"
import {mutes} from "src/engine/people/derived"
import {session} from "src/engine/session/derived"
import {userEvents} from "src/engine/events/derived"
import {notificationsLastChecked} from "./state"

export const notifications = derived(
  [session, userEvents.mapStore.throttle(500), events.throttle(500)],
  ([$session, $userEvents, $events]) => {
    if (!$session) {
      return []
    }

    return $events.filter(e => {
      const {root, reply} = findReplyAndRootIds(e)

      if (e.pubkey === $session.pubkey || isEventMuted(mutes.get(), e)) {
        return false
      }

      return (
        $userEvents.get(root) ||
        $userEvents.get(reply) ||
        Tags.from(e).pubkeys().includes($session.pubkey)
      )
    })
  }
)

export const hasNewNotifications = derived(
  [notificationsLastChecked, notifications],
  ([$notificationsLastChecked, $notifications]) =>
    $notifications.map(prop("created_at")).reduce(max, 0) > $notificationsLastChecked
)

export const groupNotifications = $notifications => {
  const $userEvents = userEvents.mapStore.get()

  // Convert zaps to zap requests
  const convertZap = e => {
    if (e.kind === 9735) {
      return tryJson(() => JSON.parse(Tags.from(e).asMeta().description as string))
    }

    return e
  }

  const groups = {}

  // Group notifications by event
  for (const ix of $notifications) {
    const eventId = findReplyId(ix)
    const event = $userEvents.get(eventId)

    if (reactionKinds.includes(ix.kind) && !event) {
      continue
    }

    // Group and sort by day/event so we can group clustered reactions to the same event
    const key = formatTimestampAsLocalISODate(ix.created_at).slice(0, 11) + (eventId || ix.id)

    groups[key] = groups[key] || {key, event, interactions: []}
    groups[key].interactions.push(convertZap(ix))
  }

  return sortBy(
    g => -g.timestamp,
    Object.values(groups).map((group: any) => {
      const {event, interactions} = group
      const timestamp = interactions
        .map(ix => ix.created_at)
        .concat(event?.created_at || 0)
        .reduce(max, 0)

      return {...group, timestamp}
    })
  )
}
