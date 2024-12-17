import type {Page} from "@sveltejs/kit"
import {makeChatId, decodeRelay, encodeRelay, userRoomsByUrl} from "@app/state"

export const makeSpacePath = (url: string, ...extra: string[]) => {
  let path = `/spaces/${encodeRelay(url)}`

  if (extra.length > 0) {
    path += "/" + extra.map(s => encodeURIComponent(s)).join("/")
  }

  return path
}

export const makeChatPath = (pubkeys: string[]) => `/chat/${makeChatId(pubkeys)}`

export const makeRoomPath = (url: string, room: string) => `/spaces/${encodeRelay(url)}/${room}`

export const makeThreadPath = (url: string, eventId?: string) => {
  let path = `/spaces/${encodeRelay(url)}/threads`

  if (eventId) {
    path += "/" + eventId
  }

  return path
}

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
