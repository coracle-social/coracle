import type {Page} from "@sveltejs/kit"
import {userMembership, makeChatId, decodeRelay, encodeRelay, getMembershipUrls} from "@app/state"

export const makeSpacePath = (url: string, extra = "") => {
  let path = `/spaces/${encodeRelay(url)}`

  if (extra) {
    path += "/" + encodeURIComponent(extra)
  }

  return path
}

export const makeChatPath = (pubkeys: string[]) => `/chat/${makeChatId(pubkeys)}`

export const makeThreadPath = (url: string, eventId: string) => `/spaces/${encodeRelay(url)}/threads/${eventId}`

export const getPrimaryNavItem = ($page: Page) => $page.route?.id?.split("/")[1]

export const getPrimaryNavItemIndex = ($page: Page) => {
  const urls = getMembershipUrls(userMembership.get())

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
