import Bugsnag from "@bugsnag/js"
import {prop, last} from "ramda"
import {uuid} from "hurdak/lib/hurdak"
import type {Writable} from 'svelte/store'
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

export interface Toast<T> extends Writable<T> {
  show(type: string, message: string, timeout?: number): void
}

export const toast = writable(null) as Toast<any>

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
  history: [],
  set: data => {
    if (data) {
      modal.history.push(data)
      navigate(location.pathname + `#m=${modal.history.length - 1}`)
    } else {
      modal.history = []
      navigate(location.pathname)
    }
  },
  subscribe: cb => {
    cb(last(modal.history))

    return globalHistory.listen(({action}) => {
      const match = location.hash.match(/\bm=(\d+)/)
      const i = match ? parseInt(match[1]) : null

      modal.history.splice(i === null ? -1 : i + 1)

      cb(modal.history[i])
    })
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

    event.setUser(session)

    return true
  })
})

const session = Math.random().toString().slice(2)

export const logUsage = async name => {
  const {dufflepudUrl, reportAnalytics} = get(settings)

  if (reportAnalytics) {
    try {
      await fetch(`${dufflepudUrl}/usage/${session}/${name}`, {method: 'post' })
    } catch (e) {
      console.warn(e)
    }
  }
}
