import {debounce} from "throttle-debounce"
import {prop, last, fromPairs} from "ramda"
import {randomId, Storage} from "hurdak"
import {parseHex} from "src/util/html"
import type {Writable} from "src/engine"
import {writable} from "src/engine"

export const synced = (key: string, defaultValue: any) => {
  const store = writable(Storage.getJson(key) || defaultValue)

  store.subscribe(debounce(1000, $value => Storage.setJson(key, $value)))

  return store
}

// Settings

export const appName = import.meta.env.VITE_APP_NAME

// Install prompt

export const installPrompt = writable(null)

export const installAsPWA = () => {
  installPrompt.get().prompt()

  installPrompt.get().userChoice.then(result => {
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
      if (prop("id", toast.get()) === id) {
        toast.set(null)
      }
    }, timeout * 1000)
  }
}

// Themes

const parseTheme = raw =>
  fromPairs(raw.split(",").map((x: string) => x.split(":"))) as Record<string, string>

const DARK_THEME = parseTheme(import.meta.env.VITE_DARK_THEME)

const LIGHT_THEME = parseTheme(import.meta.env.VITE_LIGHT_THEME)

const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches

export const theme = synced("ui/theme", prefersDark ? "dark" : "light")
theme.subscribe(value => {
  if (value === "dark") {
    document.documentElement.classList.add("dark");
  }
});

export const toggleTheme = () => {
  theme.update(t => {
    const newTheme = t === "dark" ? "light" : "dark";
    document.documentElement.classList.toggle("dark", newTheme === "dark");
    return newTheme;
  });
};

export const themeColors = theme.derived($theme => ($theme === "dark" ? DARK_THEME : LIGHT_THEME))

export const themeVariables = themeColors.derived($colors => {
  return Object.entries($colors)
    .map(([k, v]) => `--${k}: ${v};`)
    .join("\n")
})

export const themeBackgroundGradient = themeColors.derived($colors => {
  const color = parseHex($colors["dark"])

  return {
    rgba: `rgba(${color.join(", ")}, 0.5)`,
    rgb: `rgba(${color.join(", ")})`,
  }
})

export const getModal = () => last(Array.from(document.querySelectorAll(".modal-content")))
