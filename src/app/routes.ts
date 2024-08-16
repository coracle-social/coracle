import type {Page} from "@sveltejs/kit"
import {userGroupsByNom} from "@app/state"

export const makeSpacePath = (nom: string) => `/spaces/${nom}`

export const getPrimaryNavItem = ($page: Page) => {
  if ($page.route?.id?.match("^/(spaces|themes)$")) return "discover"
  if ($page.route?.id?.startsWith("/spaces")) return "space"
  if ($page.route?.id?.startsWith("/settings")) return "settings"
  return "home"
}

export const getPrimaryNavItemIndex = ($page: Page) => {
  switch (getPrimaryNavItem($page)) {
    case "discover":
      return userGroupsByNom.get().size + 2
    case "space":
      return Array.from(userGroupsByNom.get().keys()).findIndex(nom => nom === $page.params.nom) + 1
    case "settings":
      return userGroupsByNom.get().size + 3
    default:
      return 0
  }
}
