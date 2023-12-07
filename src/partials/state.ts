import {prop, last, fromPairs} from "ramda"
import {randomId} from "hurdak"
import type {Writable} from "svelte/store"
import {writable, derived, get} from "svelte/store"
import {parseHex} from "src/util/html"
import {synced} from "src/util/misc"

// Settings

export const appName = import.meta.env.VITE_APP_NAME

// Install prompt

export const installPrompt = writable(null)

export const installAsPWA = () => {
  $installPrompt.prompt()

  $installPrompt.userChoice.then(result => {
    installPrompt.set(null)
  })
}

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

// Themes

const parseTheme = raw => fromPairs(raw.split(",").map((x: string) => x.split(":")))

const DARK_THEME = parseTheme(import.meta.env.VITE_DARK_THEME)

const LIGHT_THEME = parseTheme(import.meta.env.VITE_LIGHT_THEME)

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

export const theme = synced("ui/theme", prefersDark ? "dark" : "light")

export const toggleTheme = () => theme.update(t => (t === "dark" ? "light" : "dark"))

export const themeColors = derived(theme, $theme => ($theme === "dark" ? DARK_THEME : LIGHT_THEME))

export const themeVariables = derived(themeColors, $colors => {
  return Object.entries($colors)
    .map(([k, v]) => `--${k}: ${v};`)
    .join("\n")
})

export const themeBackgroundGradient = derived(themeColors, $colors => {
  const color = parseHex($colors["dark"])

  return {
    rgba: `rgba(${color.join(", ")}, 0.5)`,
    rgb: `rgba(${color.join(", ")})`,
  }
})

export const getModal = () => last(Array.from(document.querySelectorAll(".modal-content")))
