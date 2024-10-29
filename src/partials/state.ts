import Bowser from "bowser"
import {fromPairs} from "ramda"
import {derived, writable, get} from "svelte/store"
import {parseHex} from "src/util/html"
import {synced} from "src/util/misc"

// Browser

export const browser = Bowser.parse(window.navigator.userAgent)

// Settings

export const appName = import.meta.env.VITE_APP_NAME

// Install prompt

export const installPrompt = writable(null)

export const installAsPWA = () => {
  get(installPrompt).prompt()

  get(installPrompt).userChoice.then(result => {
    installPrompt.set(null)
  })
}

// Themes

const parseTheme = raw =>
  fromPairs(raw.split(",").map((x: string) => x.split(":"))) as Record<string, string>

const DARK_THEME = parseTheme(import.meta.env.VITE_DARK_THEME)

const LIGHT_THEME = parseTheme(import.meta.env.VITE_LIGHT_THEME)

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

export const theme = synced("ui/theme", "dark")

theme.subscribe(value => {
  if (value === "dark") {
    document.documentElement.classList.add("dark")
  } else {
    document.documentElement.classList.remove("dark")
  }
})

export const toggleTheme = () => theme.update(t => (t === "dark" ? "light" : "dark"))

export const themeColors = derived(theme, $theme =>
  fromPairs(
    Object.entries($theme === "dark" ? DARK_THEME : LIGHT_THEME).flatMap(([k, v]) => [
      [k, v],
      [`${k}-l`, adjustBrightness(v, 10)],
      [`${k}-d`, adjustBrightness(v, -10)],
    ]),
  ),
)

export const themeVariables = derived(themeColors, $colors =>
  Object.entries($colors)
    .map(([k, v]) => `--${k}: ${v};`)
    .join("\n"),
)

export const themeBackgroundGradient = derived(themeColors, $colors => {
  const color = parseHex($colors["neutral-800"])

  return {
    rgba: `rgba(${color.join(", ")}, 0.5)`,
    rgb: `rgba(${color.join(", ")})`,
  }
})

function adjustBrightness(hexColor, brightnessPercent) {
  // Remove '#' if present
  hexColor = hexColor.replace("#", "")

  // Convert hex to RGB
  const r = parseInt(hexColor.substring(0, 2), 16)
  const g = parseInt(hexColor.substring(2, 4), 16)
  const b = parseInt(hexColor.substring(4, 6), 16)

  // Adjust brightness
  const adjust = brightnessPercent / 100 // Adjustment factor
  const adjustedR = Math.round(r + r * adjust)
  const adjustedG = Math.round(g + g * adjust)
  const adjustedB = Math.round(b + b * adjust)

  // Ensure RGB values are within [0, 255] range
  const clamp = value => Math.max(0, Math.min(255, value))

  // Convert RGB back to hex
  const adjustedHex =
    "#" +
    clamp(adjustedR).toString(16).padStart(2, "0") +
    clamp(adjustedG).toString(16).padStart(2, "0") +
    clamp(adjustedB).toString(16).padStart(2, "0")

  return adjustedHex
}
