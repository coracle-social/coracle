import {derived} from "svelte/store"
import {synced, throttled} from "@welshman/store"
import {pubkey} from "@welshman/app"
import {prop, spec, identity, now, groupBy} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {MESSAGE, COMMENT, getTagValue} from "@welshman/util"
import {makeSpacePath, makeChatPath, makeThreadPath, makeRoomPath} from "@app/routes"
import {
  THREAD_FILTER,
  COMMENT_FILTER,
  chats,
  getUrlsForEvent,
  userRoomsByUrl,
  repositoryStore,
} from "@app/state"

// Checked state

export const checked = synced<Record<string, number>>("checked", {})

export const deriveChecked = (key: string) => derived(checked, prop(key))

export const setChecked = (key: string) => checked.update(state => ({...state, [key]: now()}))

// Derived notifications state

export const notifications = derived(
  throttled(
    1000,
    derived([pubkey, checked, chats, userRoomsByUrl, repositoryStore, getUrlsForEvent], identity),
  ),
  ([$pubkey, $checked, $chats, $userRoomsByUrl, $repository, $getUrlsForEvent]) => {
    const hasNotification = (path: string, latestEvent: TrustedEvent | undefined) => {
      if (!latestEvent || latestEvent.pubkey === $pubkey) {
        return false
      }

      for (const [entryPath, ts] of Object.entries($checked)) {
        const isMatch =
          entryPath === "*" ||
          entryPath.startsWith(path) ||
          (entryPath === "/chat/*" && path.startsWith("/chat/"))

        if (isMatch && ts > latestEvent.created_at) {
          return false
        }
      }

      return true
    }

    const paths = new Set<string>()

    for (const {pubkeys, messages} of $chats) {
      const chatPath = makeChatPath(pubkeys)

      if (hasNotification(chatPath, messages[0])) {
        paths.add("/chat")
        paths.add(chatPath)
      }
    }

    const allThreadEvents = $repository.query([THREAD_FILTER, COMMENT_FILTER])
    const allMessageEvents = $repository.query([{kinds: [MESSAGE]}])

    for (const [url, rooms] of $userRoomsByUrl.entries()) {
      const spacePath = makeSpacePath(url)
      const threadPath = makeThreadPath(url)
      const threadEvents = allThreadEvents.filter(e => $getUrlsForEvent(e.id).includes(url))

      if (hasNotification(threadPath, threadEvents[0])) {
        paths.add(spacePath)
        paths.add(threadPath)
      }

      const commentsByThreadId = groupBy(
        e => getTagValue("E", e.tags),
        threadEvents.filter(spec({kind: COMMENT})),
      )

      for (const [threadId, [comment]] of commentsByThreadId.entries()) {
        const threadItemPath = makeThreadPath(url, threadId)

        if (hasNotification(threadItemPath, comment)) {
          paths.add(threadItemPath)
        }
      }

      for (const room of rooms) {
        const roomPath = makeRoomPath(url, room)
        const latestEvent = allMessageEvents.find(
          e =>
            $getUrlsForEvent(e.id).includes(url) && e.tags.find(t => t[0] === "h" && t[1] === room),
        )

        if (hasNotification(roomPath, latestEvent)) {
          paths.add(spacePath)
          paths.add(roomPath)
        }
      }
    }

    return paths
  },
)
