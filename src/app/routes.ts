import {nip19} from "nostr-tools"
import type {Page} from "@sveltejs/kit"
import {userMembership, makeChatId, decodeNRelay} from "@app/state"

export const makeSpacePath = (url: string, extra = "") => {
  let path = `/spaces/${nip19.nrelayEncode(url)}`

  if (extra) {
    path += "/" + encodeURIComponent(extra)
  }

  return path
}

export const makeChatPath = (pubkeys: string[]) => `/home/${makeChatId(pubkeys)}`

export const getPrimaryNavItem = ($page: Page) => $page.route?.id?.split("/")[1]

export const getPrimaryNavItemIndex = ($page: Page) => {
  const urls = Array.from(userMembership.get()?.roomsByUrl.keys() || [])

  switch (getPrimaryNavItem($page)) {
    case "discover":
      return urls.length + 2
    case "spaces": {
      const routeUrl = decodeNRelay($page.params.nrelay)

      return urls.findIndex(url => url === routeUrl) + 1
    }
    case "settings":
      return urls.length + 3
    default:
      return 0
  }
}
