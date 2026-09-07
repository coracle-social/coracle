import {now, without} from "@welshman/lib"
import {Events} from "@welshman/app"
import {throttled} from "@welshman/store"
import {POLL_RESPONSE, type TrustedEvent} from "@welshman/util"
import {fromApp, pubkey} from "src/engine/core"
import {OnboardingTask} from "src/engine/model"
import {sortEventsDesc} from "src/engine/utils"
import {checked, getSeenAt, isEventMuted, sessionWithMeta} from "src/engine/state"
import {noteKinds, reactionKinds, repostKinds} from "src/util/nostr"
import {derived} from "svelte/store"

export const isSeen = derived(
  getSeenAt,
  $getSeenAt => (key: string, event: TrustedEvent) => $getSeenAt(key, event) > 0,
)

export const setChecked = (path: string, ts = now()) =>
  checked.update(state => ({...state, [path]: ts}))

// Notifications

// These are bound at module scope, so they read the repository through fromApp — otherwise
// they'd keep querying the app that was current at import time.

// -- Main Notifications

export const mainNotifications = derived(
  [
    pubkey,
    isEventMuted,
    throttled(
      800,
      fromApp($app => $app.use(Events).all([{kinds: [...noteKinds, POLL_RESPONSE]}]).$),
    ),
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
    throttled(
      800,
      fromApp($app => $app.use(Events).all([{kinds: [...reactionKinds, ...repostKinds]}]).$),
    ),
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
