import {prop} from "ramda"
import Bugsnag from "@bugsnag/js"
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
  showLinkPreviews: true,
  dufflepudUrl: import.meta.env.VITE_DUFFLEPUD_URL,
})
