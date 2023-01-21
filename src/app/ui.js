import Bugsnag from "@bugsnag/js"
import {prop} from "ramda"
import {uuid} from "hurdak/lib/hurdak"
import {navigate} from "svelte-routing"
import {nip19} from 'nostr-tools'
import {writable, get} from "svelte/store"
import {globalHistory} from "svelte-routing/src/history"
import {synced} from "src/util/misc"

// Routing

export const routes = {
  person: (pubkey, tab = 'notes') => `/people/${nip19.npubEncode(pubkey)}/${tab}`,
}

// Toast

export const toast = writable(null)

toast.show = (type, message, timeout = 5) => {
  const id = uuid()

  toast.set({id, type, message})

  setTimeout(() => {
    if (prop("id", get(toast)) === id) {
      toast.set(null)
    }
  }, timeout * 1000)
}

// Modals

export const modal = {
  subscribe: cb => {
    const getModal = () =>
      location.hash.includes('#modal=')
        ? JSON.parse(decodeURIComponent(escape(atob(location.hash.replace('#modal=', '')))))
        : null

    cb(getModal())

    return globalHistory.listen(() => cb(getModal()))
  },
  set: data => {
    let path = location.pathname
    if (data) {
      path += '#modal=' + btoa(unescape(encodeURIComponent(JSON.stringify(data))))
    }

    navigate(path)
  },
}

// Settings, alerts, etc

export const settings = synced("coracle/settings", {
  reportAnalytics: true,
  showLinkPreviews: true,
  dufflepudUrl: import.meta.env.VITE_DUFFLEPUD_URL,
})

// Wait for bugsnag to be started in main
setTimeout(() => {
  Bugsnag.addOnError(event => {
    if (window.location.host.startsWith('localhost')) {
      return false
    }

    if (!get(settings).reportAnalytics) {
      return false
    }

    return true
  })
})

const session = Math.random().toString().slice(2)

export const logUsage = name => {
  const {dufflepudUrl, reportAnalytics} = get(settings)

  if (reportAnalytics) {
    fetch(`${dufflepudUrl}/usage/${session}/${name}`, {method: 'post' })
  }
}
