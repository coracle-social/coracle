import {prop, last, fromPairs} from "ramda"
import {randomId, range} from "hurdak"
import type {Writable} from "svelte/store"
import {writable, get} from "svelte/store"
import {parseHex} from "src/util/html"
import {shadeColor, synced} from "src/util/misc"

// Settings

export const appName = import.meta.env.VITE_APP_NAME

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

export const getModal = () => last(Array.from(document.querySelectorAll(".modal-content")))
