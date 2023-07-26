import {prop, whereEq, reject, last, fromPairs} from "ramda"
import {randomId, range} from "hurdak"
import type {Writable} from "svelte/store"
import {navigate} from "svelte-routing"
import {writable, get} from "svelte/store"
import {globalHistory} from "svelte-routing/src/history"
import {parseHex} from "src/util/html"
import {shadeColor, synced} from "src/util/misc"

// Settings

export const appName = import.meta.env.VITE_APP_NAME

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
  const id = randomId()

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

export const modal = {
  stack: writable([]),
  getCurrent() {
    return last(get(modal.stack))
  },
  sync($stack: any[], opts = {}) {
    const hash = $stack.length > 0 ? `#m=${$stack.length}` : ""

    if (hash !== window.location.hash) {
      navigate(window.location.pathname + hash, opts)
    }

    return $stack
  },
  remove(id: string) {
    modal.stack.update($stack => modal.sync(reject(whereEq({id}), $stack)))
  },
  push(data: {type: string; [k: string]: any}) {
    modal.stack.update($stack => modal.sync($stack.concat(data)))
  },
  pop() {
    modal.stack.update($stack => modal.sync($stack.slice(0, -1)))
  },
  replace(data: {type: string; [k: string]: any}) {
    modal.stack.update($stack => $stack.slice(0, -1).concat(data))
  },
  clear() {
    const stackSize = (get(modal.stack) as any).length

    // Reverse history so the back button doesn't bring our modal back up
    for (let i = 0; i < stackSize; i++) {
      modal.pop()
    }
  },
}

location.subscribe(($location: any) => {
  const match = $location.hash.match(/\bm=(\d+)/)
  const i = match ? parseInt(match[1]) : 0

  modal.stack.update($stack => (i < $stack.length ? $stack.slice(0, i) : $stack))
})

// Themes

const THEME = fromPairs(
  import.meta.env.VITE_THEME.split(",").map((x: string) => x.split(":"))
) as Record<string, string>
const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

export const theme = synced("ui/theme", prefersDark ? "dark" : "light")

export const getThemeColors = ($theme: string) => {
  for (const x of range(1, 10)) {
    const lum = $theme === "dark" ? (5 - x) * 25 : (x - 5) * 25

    THEME[`gray-${x}`] = shadeColor(THEME[`gray-${$theme}`], lum)
  }

  return THEME
}

export const getThemeColor = ($theme: string, k: string) => prop(k, getThemeColors($theme))

export const getThemeVariables = ($theme: string) =>
  Object.entries(getThemeColors($theme))
    .map(([k, v]) => `--${k}: ${v};`)
    .join("\n")

export const getThemeBackgroundGradient = () => {
  const color = parseHex(getThemeColor(get(theme), "gray-8"))

  return {
    rgba: `rgba(${color.join(", ")}, 0.5)`,
    rgb: `rgba(${color.join(", ")})`,
  }
}
