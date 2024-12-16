import {writable, derived} from "svelte/store"
import {page} from "$app/stores"
import {deriveEvents} from "@welshman/store"
import {repository, pubkey} from "@welshman/app"
import {prop, max, sortBy, assoc, lt, now} from "@welshman/lib"
import type {Filter, TrustedEvent} from "@welshman/util"
import {DIRECT_MESSAGE, MESSAGE, THREAD, COMMENT} from "@welshman/util"
import {makeSpacePath, makeThreadPath, makeRoomPath} from "@app/routes"
import {
  LEGACY_THREAD,
  getEventsForUrl,
  deriveEventsForUrl,
  getMembershipUrls,
  userRoomsByUrl,
  repositoryStore,
} from "@app/state"

// Checked state

export const checked = writable<Record<string, number>>({})

checked.subscribe(v => console.log("====== checked", v))

export const deriveChecked = (key: string) => derived(checked, prop(key))

export const setChecked = (key: string, ts = now()) =>
  Boolean(console.trace("====== setChecked", key)) ||
  checked.update(state => ({...state, [key]: ts}))

// Filters for various routes

export const CHAT_FILTERS: Filter[] = [{kinds: [DIRECT_MESSAGE]}]

export const SPACE_FILTERS: Filter[] = [{kinds: [THREAD, MESSAGE, COMMENT]}]

export const ROOM_FILTERS: Filter[] = [{kinds: [MESSAGE]}]

export const THREAD_FILTERS: Filter[] = [
  {kinds: [THREAD, LEGACY_THREAD]},
  {kinds: [COMMENT], "#K": [String(THREAD), String(LEGACY_THREAD)]},
]

export const getNotificationFilters = (since: number): Filter[] =>
  [...CHAT_FILTERS, ...SPACE_FILTERS, ...THREAD_FILTERS].map(assoc("since", since))

export const getRoomFilters = (room: string): Filter[] => ROOM_FILTERS.map(assoc("#h", [room]))

// Notification derivation

export const getNotification = (
  pubkey: string | null,
  lastChecked: number,
  events: TrustedEvent[],
) => {
  const [latestEvent] = sortBy($e => -$e.created_at, events)

  return latestEvent?.pubkey !== pubkey && lt(lastChecked, latestEvent?.created_at)
}

export const deriveNotification = (path: string, filters: Filter[], url?: string) => {
  const events = url ? deriveEventsForUrl(url, filters) : deriveEvents(repository, {filters})

  return derived(
    [pubkey, deriveChecked("*"), deriveChecked(path), events],
    ([$pubkey, $allChecked, $checked, $events]) => {
      return getNotification($pubkey, max([$allChecked, $checked]), $events)
    },
  )
}

export const spacesNotifications = derived(
  [pubkey, checked, userRoomsByUrl, repositoryStore],
  ([$pubkey, $checked, $userRoomsByUrl, $repository]) => {
    const hasNotification = (url: string, path: string, filters: Filter[]) => {
      const lastChecked = max([$checked["*"], $checked[path]])
      const events = getEventsForUrl($repository, url, filters)

      return getNotification($pubkey, lastChecked, events)
    }

    return Array.from($userRoomsByUrl.entries())
      .filter(([url, rooms]) => {
        if (hasNotification(url, makeThreadPath(url), THREAD_FILTERS)) {
          return true
        }

        for (const room of rooms) {
          if (hasNotification(url, makeRoomPath(url, room), [{kinds: [MESSAGE], "#h": [room]}])) {
            return true
          }
        }

        return false
      })
      .map(([url]) => makeSpacePath(url))
  },
)

export const inactiveSpacesNotifications = derived(
  [page, spacesNotifications],
  ([$page, $spacesNotifications]) =>
    $spacesNotifications.filter(path => !$page.url.pathname.startsWith(path)),
)
