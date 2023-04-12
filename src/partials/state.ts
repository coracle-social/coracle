import {prop, fromPairs, last} from "ramda"
import {uuid, switcher} from "hurdak/lib/hurdak"
import type {Writable} from "svelte/store"
import {navigate} from "svelte-routing"
import {writable, get} from "svelte/store"
import {globalHistory} from "svelte-routing/src/history"
import {sleep, synced} from "src/util/misc"

// Location

export const location = (() => {
  const store = writable(window.location)

  globalHistory.listen(({location}) => store.set(location))

  return store
})()

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

// Modals

export const openModals = writable(0)

export const modal = {
  history: [],
  set: data => {
    if (data) {
      modal.history.push(data)
      navigate(window.location.pathname + `#m=${modal.history.length - 1}`)
    } else {
      modal.history = []
      navigate(window.location.pathname)
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

    return location.subscribe($location => {
      const match = $location.hash.match(/\bm=(\d+)/)
      const i = match ? parseInt(match[1]) : null

      modal.history.splice(i === null ? -1 : i + 1)

      cb(modal.history[i])
    })
  },
}

// Themes

const parseTheme = s => fromPairs(s.split(",").map(x => x.split(":")))
const THEME_LIGHT = parseTheme(import.meta.env.VITE_THEME_LIGHT)
const THEME_DARK = parseTheme(import.meta.env.VITE_THEME_DARK)
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

export const theme = synced("ui/theme", prefersDark ? "dark" : "light")

export const getThemeColors = $theme => switcher($theme, {light: THEME_LIGHT, dark: THEME_DARK})

export const getThemeColor = ($theme, k) => prop(k, getThemeColors($theme))

export const getThemeVariables = $theme =>
  Object.entries(getThemeColors($theme))
    .map(([k, v]) => `--${k}: ${v};`)
    .join("\n")
