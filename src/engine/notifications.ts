import {now, spec, without} from "@welshman/lib"
import {throttled} from "@welshman/store"
import {POLL_RESPONSE, type TrustedEvent} from "@welshman/util"
import {events, pubkey} from "src/engine/core"
import {OnboardingTask} from "src/engine/model"
import {checked, getSeenAt, isEventMuted, sessionWithMeta} from "src/engine/state"
import {noteKinds, reactionKinds, repostKinds} from "src/util/nostr"
import {derived} from "svelte/store"

const isSeen = derived(
  getSeenAt,
  $getSeenAt => (key: string, event: TrustedEvent) => $getSeenAt(key, event) > 0,
)

export const setChecked = (path: string, ts = now()) =>
  checked.update(state => ({...state, [path]: ts}))

// Notifications

const deriveNotifications = (kinds: number[]) => {
  const mentions = derived(
    [events, pubkey],
    ([$events, $pubkey], set: (value: TrustedEvent[]) => void) =>
      $pubkey ? $events.desc([{kinds, "#p": [$pubkey]}]).$.subscribe(set) : set([]),
    [] as TrustedEvent[],
  )

  return derived(
    [pubkey, isEventMuted, throttled(800, mentions)],
    ([$pubkey, $isEventMuted, $mentions]) =>
      $mentions.filter(
        e => e.pubkey !== $pubkey && e.tags.some(spec(["p", $pubkey])) && !$isEventMuted(e),
      ),
  )
}

export const mainNotifications = deriveNotifications([...noteKinds, POLL_RESPONSE])

export const unreadMainNotifications = derived(
  [isSeen, mainNotifications],
  ([$isSeen, $notifications]) => $notifications.filter(e => !$isSeen("notes/*", e)),
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

export const reactionNotifications = deriveNotifications([...reactionKinds, ...repostKinds])

export const unreadReactionNotifications = derived(
  [isSeen, reactionNotifications],
  ([$isSeen, $notifications]) => $notifications.filter(e => !$isSeen("reactions/*", e)),
)
