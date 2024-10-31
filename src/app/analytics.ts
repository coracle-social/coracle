/* eslint prefer-rest-params: 0 */

import {page} from "$app/stores"

const w = window as any

w.plausible =
  w.plausible ||
  function () {
    ;(w.plausible.q = w.plausible.q || []).push(arguments)
  }

export const setupAnalytics = () => {
  page.subscribe($page => {
    if ($page.route) {
      w.plausible("pageview", {u: $page.route.id})
    }
  })
}
