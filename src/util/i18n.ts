import {register, init, getLocaleFromNavigator} from "svelte-i18n"
import {get} from "svelte/store"
import {locale} from "src/partials/state"
import en from "src/locales/en.json"

// English loaded synchronously (fallback), French lazy-loaded
register("en", () => Promise.resolve(en))
register("fr", () => import("src/locales/fr.json"))

init({
  fallbackLocale: "en",
  initialLocale: get(locale) || getLocaleFromNavigator()?.split("-")[0] || "en",
})

// Re-export currencies so existing imports don't break
export {currencyOptions, defaultCurrencyOption, getCurrencyOption} from "./currencies"
