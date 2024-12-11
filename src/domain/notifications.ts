import {pubkey, repository} from "@welshman/app"
import {now} from "@welshman/lib"
import {deriveEvents} from "@welshman/store"
import {type TrustedEvent} from "@welshman/util"
import {without} from "ramda"
import {OnboardingTask} from "src/engine/model"
import {checked, getSeenAt, isEventMuted, sessionWithMeta} from "src/engine/state"
import {isLike, noteKinds, reactionKinds} from "src/util/nostr"
import {derived} from "svelte/store"

export const isSeen = derived(
  getSeenAt,
  $getSeenAt => (key: string, event: TrustedEvent) => $getSeenAt(key, event) > 0,
)

export const setChecked = (keys: string[], ts = now()) =>
  checked.update(state => {
    keys.forEach(key => {
      state = {...state, [key]: ts}
    })
    return state
  })

// Notifications

// -- Main Notifications

export const mainNotifications = derived(
  [pubkey, isEventMuted, deriveEvents(repository, {throttle: 800, filters: [{kinds: noteKinds}]})],
  ([$pubkey, $isEventMuted, $events]) =>
    $events.filter(
      e =>
        e.pubkey !== $pubkey &&
        e.tags.some(t => t[0] === "p" && t[1] === $pubkey) &&
        !$isEventMuted(e),
    ),
)

export const unreadMainNotifications = derived([isSeen, mainNotifications], ([$isSeen, events]) =>
  events.filter(e => !$isSeen("replies", e) && !$isSeen("mentions", e)),
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
    $events.filter(
      e =>
        e.pubkey !== $pubkey &&
        e.tags.some(t => t[0] === "p" && t[1] === $pubkey) &&
        !$isEventMuted(e) &&
        isLike(e),
    ),
)

export const unreadReactionNotifications = derived(
  [isSeen, reactionNotifications],
  ([$isSeen, events]) => events.filter(e => !$isSeen("reactions", e) && !$isSeen("zaps", e)),
)
