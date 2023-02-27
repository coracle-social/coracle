import Bugsnag from "@bugsnag/js"
import {prop, last} from "ramda"
import {uuid} from "hurdak/lib/hurdak"
import type {Writable} from 'svelte/store'
import {navigate} from "svelte-routing"
import {nip19} from 'nostr-tools'
import {writable, get} from "svelte/store"
import {globalHistory} from "svelte-routing/src/history"
import {sleep} from "src/util/misc"
import {warn} from 'src/util/logger'
import user from 'src/agent/user'

// Routing

export const routes = {
  person: (pubkey, tab = 'notes') => `/people/${nip19.npubEncode(pubkey)}/${tab}`,
}

// Install prompt

export const installPrompt = writable(null)

// Toast

export interface Toast<T> extends Writable<T> {
  show(type: string, message: any, timeout?: number): void
}

export const toast = writable(null) as Toast<any>

toast.show = (type, message, timeout = 5) => {
  const id = uuid()

  toast.set({id, type, message})

  if (timeout) {
    setTimeout(() => {
      if (prop("id", get(toast)) === id) {
        toast.set(null)
      }
    }, timeout * 1000)
  }
}

// Menu

export const menuIsOpen = writable(false)

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
  close: () => modal.set(null),
  clear: async () => {
    // Reverse history so the back button doesn't bring our modal back up
    while (get(modal)) {
      history.back()
      await sleep(30)
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

// Redact long strings, especially hex and bech32 keys which are 64 and 63
// characters long, respectively. Put the threshold a little lower in case
// someone accidentally enters a key with the last few digits missing
const redactErrorInfo = info =>
  JSON.parse(JSON.stringify(info) .replace(/\w{60}\w+/g, '[REDACTED]'))

// Wait for bugsnag to be started in main
setTimeout(() => {
  Bugsnag.addOnError((event: any) => {
    if (window.location.host.startsWith('localhost')) {
      return false
    }

    if (!user.getSetting('reportAnalytics')) {
      return false
    }

    // Redact individual properties since the event needs to be
    // mutated, and we don't want to lose the prototype
    event.context = redactErrorInfo(event.context)
    event.request = redactErrorInfo(event.request)
    event.exceptions = redactErrorInfo(event.exceptions)
    event.breadcrumbs = redactErrorInfo(event.breadcrumbs)

    event.setUser(session)

    return true
  })
})

const session = Math.random().toString().slice(2)

export const logUsage = async name => {
  const {dufflepudUrl, reportAnalytics} = user.getSettings()

  if (reportAnalytics) {
    try {
      await fetch(`${dufflepudUrl}/usage/${session}/${name}`, {method: 'post' })
    } catch (e) {
      if (!e.toString().includes('Failed to fetch')) {
        warn(e)
      }
    }
  }
}

