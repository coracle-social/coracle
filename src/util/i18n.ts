import {register, init, getLocaleFromNavigator, waitLocale} from "svelte-i18n"
import {get} from "svelte/store"
import {locale} from "src/partials/state"
import en from "src/locales/en.json"

// English loaded synchronously (fallback), French lazy-loaded
register("en", () => Promise.resolve(en))
register("fr", () => import("src/locales/fr.json"))

// Initialize i18n
init({
  fallbackLocale: "en",
  initialLocale: get(locale) || getLocaleFromNavigator()?.split("-")[0] || "en",
})

// Export a promise that resolves when i18n is fully initialized
export const i18nReady = waitLocale()

// Re-export currencies so existing imports don't break
export {currencyOptions, defaultCurrencyOption, getCurrencyOption} from "./currencies"
