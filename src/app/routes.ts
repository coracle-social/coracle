import type {Page} from "@sveltejs/kit"
import {userGroupsByNom} from "@app/state"

export const makeSpacePath = (nom: string) => `/spaces/${nom}`

export const getPrimaryNavItem = ($page: Page) => $page.route?.id?.split("/")[1]

export const getPrimaryNavItemIndex = ($page: Page) => {
  switch (getPrimaryNavItem($page)) {
    case "discover":
      return userGroupsByNom.get().size + 2
    case "spaces":
      return Array.from(userGroupsByNom.get().keys()).findIndex(nom => nom === $page.params.nom) + 1
    case "settings":
      return userGroupsByNom.get().size + 3
    default:
      return 0
  }
}
