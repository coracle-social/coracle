import {pubkey, repository} from "@welshman/app"
import {now, without} from "@welshman/lib"
import {deriveEvents} from "@welshman/store"
import {type TrustedEvent} from "@welshman/util"
import {OnboardingTask} from "src/engine/model"
import {sortEventsDesc} from "src/engine/utils"
import {checked, getSeenAt, isEventMuted, sessionWithMeta} from "src/engine/state"
import {isLike, noteKinds, reactionKinds} from "src/util/nostr"
import {derived} from "svelte/store"

export const isSeen = derived(
  getSeenAt,
  $getSeenAt => (key: string, event: TrustedEvent) => $getSeenAt(key, event) > 0,
)

export const setChecked = (path: string, ts = now()) =>
  checked.update(state => ({...state, [path]: ts}))

// Notifications

// -- Main Notifications

export const mainNotifications = derived(
  [pubkey, isEventMuted, deriveEvents(repository, {throttle: 800, filters: [{kinds: noteKinds}]})],
  ([$pubkey, $isEventMuted, $events]) =>
    sortEventsDesc(
      $events.filter(
        e =>
          e.pubkey !== $pubkey &&
          e.tags.some(t => t[0] === "p" && t[1] === $pubkey) &&
          !$isEventMuted(e),
      ),
    ),
)

export const unreadMainNotifications = derived([isSeen, mainNotifications], ([$isSeen, events]) =>
  events.filter(e => !$isSeen("notes/*", e)),
)

export const hasNewNotifications = derived(
  [sessionWithMeta, unreadMainNotifications],
  ([$sessionWithMeta, $unread]) => {
    if ($unread.length > 0) {
      return true
    }

    if ($sessionWithMeta?.onboarding_tasks_completed) {
      return (
        without($sessionWithMeta.onboarding_tasks_completed, Object.values(OnboardingTask)).length >
        0
      )
    }

    return false
  },
)

// -- Reaction Notifications

export const reactionNotifications = derived(
  [
    pubkey,
    isEventMuted,
    deriveEvents(repository, {throttle: 800, filters: [{kinds: reactionKinds}]}),
  ],
  ([$pubkey, $isEventMuted, $events]) =>
    sortEventsDesc(
      $events.filter(
        e =>
          e.pubkey !== $pubkey &&
          e.tags.some(t => t[0] === "p" && t[1] === $pubkey) &&
          !$isEventMuted(e),
      ),
    ),
)

export const unreadReactionNotifications = derived(
  [isSeen, reactionNotifications],
  ([$isSeen, events]) => events.filter(e => !$isSeen("reactions/*", e)),
)
