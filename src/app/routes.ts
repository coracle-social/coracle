import type {Page} from "@sveltejs/kit"
import * as nip19 from "nostr-tools/nip19"
import {goto} from "$app/navigation"
import {nthEq, sleep} from "@welshman/lib"
import type {TrustedEvent} from "@welshman/util"
import {tracker} from "@welshman/app"
import {scrollToEvent} from "@lib/html"
import {identity} from "@welshman/lib"
import {
  getTagValue,
  DIRECT_MESSAGE,
  DIRECT_MESSAGE_FILE,
  MESSAGE,
  THREAD,
  EVENT_TIME,
} from "@welshman/util"
import {makeChatId, entityLink, decodeRelay, encodeRelay, userRoomsByUrl, ROOM} from "@app/state"

export const makeSpacePath = (url: string, ...extra: (string | undefined)[]) => {
  let path = `/spaces/${encodeRelay(url)}`

  if (extra.length > 0) {
    path +=
      "/" +
      extra
        .filter(identity)
        .map(s => encodeURIComponent(s as string))
        .join("/")
  }

  return path
}

export const makeChatPath = (pubkeys: string[]) => `/chat/${makeChatId(pubkeys)}`

export const makeRoomPath = (url: string, room: string) => `/spaces/${encodeRelay(url)}/${room}`

export const makeThreadPath = (url: string, eventId?: string) =>
  makeSpacePath(url, "threads", eventId)

export const makeCalendarPath = (url: string, eventId?: string) =>
  makeSpacePath(url, "calendar", eventId)

export const getPrimaryNavItem = ($page: Page) => $page.route?.id?.split("/")[1]

export const getPrimaryNavItemIndex = ($page: Page) => {
  const urls = Array.from(userRoomsByUrl.get().keys())

  switch (getPrimaryNavItem($page)) {
    case "discover":
      return urls.length + 2
    case "spaces": {
      const routeUrl = decodeRelay($page.params.relay)

      return urls.findIndex(url => url === routeUrl) + 1
    }
    case "settings":
      return urls.length + 3
    default:
      return 0
  }
}

export const goToMessage = async (url: string, room: string | undefined, id: string) => {
  await goto(room ? makeRoomPath(url, room) : makeSpacePath(url, "chat"))
  await sleep(300)

  return scrollToEvent(id)
}

export const goToEvent = async (event: TrustedEvent) => {
  if (event.kind === DIRECT_MESSAGE || event.kind === DIRECT_MESSAGE_FILE) {
    return await scrollToEvent(event.id)
  }

  const urls = Array.from(tracker.getRelays(event.id))
  const room = getTagValue(ROOM, event.tags)

  if (urls.length > 0) {
    const url = urls[0]

    if (event.kind === THREAD) {
      return goto(makeThreadPath(url, event.id))
    }

    if (event.kind === EVENT_TIME) {
      return goto(makeCalendarPath(url, event.id))
    }

    if (event.kind === MESSAGE) {
      return goToMessage(url, room, event.id)
    }

    const kind = event.tags.find(nthEq(0, "K"))?.[1]
    const id = event.tags.find(nthEq(0, "E"))?.[1]

    if (id && kind) {
      if (parseInt(kind) === THREAD) {
        return goto(makeThreadPath(url, id))
      }

      if (parseInt(kind) === EVENT_TIME) {
        return goto(makeCalendarPath(url, id))
      }

      if (parseInt(kind) === MESSAGE) {
        return goToMessage(url, room, id)
      }
    }
  }

  window.open(entityLink(nip19.neventEncode({id: event.id, relays: urls})))
}
