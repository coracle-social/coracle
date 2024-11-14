import {writable, derived} from "svelte/store"
import {deriveEvents} from "@welshman/store"
import {repository, pubkey} from "@welshman/app"
import {prop, max, sortBy, assoc, lt, now} from "@welshman/lib"
import type {Filter} from "@welshman/util"
import {DIRECT_MESSAGE} from "@welshman/util"
import {makeSpacePath} from "@app/routes"
import {
  MESSAGE,
  THREAD,
  COMMENT,
  deriveEventsForUrl,
  getMembershipUrls,
  userMembership,
} from "@app/state"

// Checked state

export const checked = writable<Record<string, number>>({})

export const deriveChecked = (key: string) => derived(checked, prop(key))

export const setChecked = (key: string, ts = now()) =>
  checked.update(state => ({...state, [key]: ts}))

// Filters for various routes

export const CHAT_FILTERS: Filter[] = [{kinds: [DIRECT_MESSAGE]}]

export const SPACE_FILTERS: Filter[] = [{kinds: [THREAD, MESSAGE, COMMENT]}]

export const ROOM_FILTERS: Filter[] = [{kinds: [MESSAGE]}]

export const THREAD_FILTERS: Filter[] = [
  {kinds: [THREAD]},
  {kinds: [COMMENT], "#K": [String(THREAD)]},
]

export const getNotificationFilters = (since: number): Filter[] =>
  [...CHAT_FILTERS, ...SPACE_FILTERS, ...THREAD_FILTERS].map(assoc("since", since))

export const getRoomFilters = (room: string): Filter[] => ROOM_FILTERS.map(assoc("#~", [room]))

// Notification derivation

export const deriveNotification = (path: string, filters: Filter[], url?: string) => {
  const events = url ? deriveEventsForUrl(url, filters) : deriveEvents(repository, {filters})

  return derived(
    [pubkey, deriveChecked("*"), deriveChecked(path), events],
    ([$pubkey, $allChecked, $checked, $events]) => {
      const [latestEvent] = sortBy($e => -$e.created_at, $events)

      return (
        latestEvent?.pubkey !== $pubkey && lt(max([$allChecked, $checked]), latestEvent?.created_at)
      )
    },
  )
}

export const spacesNotification = derived(
  [pubkey, checked, userMembership, deriveEvents(repository, {filters: SPACE_FILTERS})],
  ([$pubkey, $checked, $userMembership, $events]) => {
    return getMembershipUrls($userMembership).some(url => {
      const path = makeSpacePath(url)
      const lastChecked = max([$checked["*"], $checked[path]])
      const [latestEvent] = sortBy($e => -$e.created_at, $events)

      return latestEvent?.pubkey !== $pubkey && lt(lastChecked, latestEvent?.created_at)
    })
  },
)
