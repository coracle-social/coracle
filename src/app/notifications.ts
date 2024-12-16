import {writable, derived} from "svelte/store"
import {page} from "$app/stores"
import {pubkey} from "@welshman/app"
import {prop, max, sortBy, now} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {MESSAGE} from "@welshman/util"
import {makeSpacePath, makeChatPath, makeThreadPath, makeRoomPath} from "@app/routes"
import {
  THREAD_FILTER,
  COMMENT_FILTER,
  chats,
  getEventsForUrl,
  userRoomsByUrl,
  repositoryStore,
} from "@app/state"

// Checked state

export const checked = writable<Record<string, number>>({})

export const deriveChecked = (key: string) => derived(checked, prop(key))

export const setChecked = (key: string) =>
  checked.update(state => ({...state, [key]: now()}))

// Derived notifications state

export const notifications = derived(
  [pubkey, checked, chats, userRoomsByUrl, repositoryStore],
  ([$pubkey, $checked, $chats, $userRoomsByUrl, $repository]) => {
    const hasNotification = (path: string, events: TrustedEvent[]) => {
      const [latestEvent] = sortBy($e => -$e.created_at, events)

      if (!latestEvent || latestEvent.pubkey === $pubkey) {
        return false
      }

      let checkPath = ""
      let lastChecked = $checked["*"]

      for (const segment of path.slice(1).split("/")) {
        checkPath += "/" + segment
        lastChecked = max([lastChecked, $checked[checkPath]])
      }

      return lastChecked < latestEvent.created_at
    }

    const paths = new Set<string>()

    for (const {pubkeys, messages} of $chats) {
      const chatPath = makeChatPath(pubkeys)

      if (hasNotification(chatPath, messages)) {
        paths.add("/chat")
        paths.add(chatPath)
      }
    }

    for (const [url, rooms] of $userRoomsByUrl.entries()) {
      const spacePath = makeSpacePath(url)
      const threadPath = makeThreadPath(url)
      const threadFilters = [THREAD_FILTER, COMMENT_FILTER]
      const threadEvents = getEventsForUrl($repository, url, threadFilters)

      if (hasNotification(threadPath, threadEvents)) {
        paths.add(spacePath)
        paths.add(threadPath)
      }

      for (const room of rooms) {
        const roomPath = makeRoomPath(url, room)
        const roomFilters = [{kinds: [MESSAGE], "#h": [room]}]
        const roomEvents = getEventsForUrl($repository, url, roomFilters)

        if (hasNotification(roomPath, roomEvents)) {
          paths.add(spacePath)
          paths.add(roomPath)
        }
      }
    }

    return paths
  },
)

export const inactiveNotifications = derived(
  [page, notifications],
  ([$page, $notifications]) =>
    new Set(Array.from($notifications).filter(path => !$page.url.pathname.startsWith(path))),
)
