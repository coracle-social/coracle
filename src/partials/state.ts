import {prop, fromPairs} from "ramda"
import {uuid, switcher} from "hurdak/lib/hurdak"
import type {Writable} from "svelte/store"
import {navigate} from "svelte-routing"
import {writable, get} from "svelte/store"
import {globalHistory} from "svelte-routing/src/history"
import {sleep, synced, WritableList} from "src/util/misc"

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
  stack: new WritableList([]) as WritableList<any>,
  sync: $stack => {
    const hash = $stack.length > 0 ? `#m=${$stack.length}` : ""

    navigate(window.location.pathname + hash)

    return $stack
  },
  push: data => modal.stack.update($stack => modal.sync($stack.concat(data))),
  pop: () => modal.stack.update($stack => modal.sync($stack.slice(0, -1))),
  clear: async () => {
    const stackSize = (get(modal.stack) as any).length

    // Reverse history so the back button doesn't bring our modal back up
    for (let i = 0; i < stackSize; i++) {
      history.back()
      await sleep(100)
    }
  },
}

location.subscribe($location => {
  const match = $location.hash.match(/\bm=(\d+)/)
  const i = match ? parseInt(match[1]) : 0

  modal.stack.update($stack => (i < $stack.length ? $stack.slice(0, i) : $stack))
})

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
