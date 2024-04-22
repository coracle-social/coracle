import {identity} from "ramda"
import {writable} from "@welshman/lib"
import {normalizeRelayUrl} from "@welshman/util"
import type {Session} from "./model"

const fromCsv = s => (s || "").split(",").filter(identity)

export const env = writable({
  CLIENT_ID: import.meta.env.VITE_CLIENT_ID,
  CLIENT_NAME: import.meta.env.VITE_CLIENT_NAME,
  DEFAULT_FOLLOWS: fromCsv(import.meta.env.VITE_DEFAULT_FOLLOWS),
  DEFAULT_RELAYS: fromCsv(import.meta.env.VITE_DEFAULT_RELAYS).map(normalizeRelayUrl),
  INDEXER_RELAYS: fromCsv(import.meta.env.VITE_INDEXER_RELAYS).map(normalizeRelayUrl),
  DUFFLEPUD_URL: import.meta.env.VITE_DUFFLEPUD_URL,
  DVM_RELAYS: fromCsv(import.meta.env.VITE_DVM_RELAYS).map(normalizeRelayUrl),
  ENABLE_MARKET: JSON.parse(import.meta.env.VITE_ENABLE_MARKET),
  ENABLE_ZAPS: JSON.parse(import.meta.env.VITE_ENABLE_ZAPS),
  FORCE_GROUP: import.meta.env.VITE_FORCE_GROUP,
  IMGPROXY_URL: import.meta.env.VITE_IMGPROXY_URL,
  MULTIPLEXTR_URL: import.meta.env.VITE_MULTIPLEXTR_URL,
  NIP96_URLS: fromCsv(import.meta.env.VITE_NIP96_URLS),
  ONBOARDING_LISTS: fromCsv(import.meta.env.VITE_ONBOARDING_LISTS),
  PLATFORM_PUBKEY: import.meta.env.VITE_PLATFORM_PUBKEY,
  PLATFORM_RELAYS: fromCsv(import.meta.env.VITE_PLATFORM_RELAYS).map(normalizeRelayUrl),
  PLATFORM_ZAP_SPLIT: parseFloat(import.meta.env.VITE_PLATFORM_ZAP_SPLIT),
  SEARCH_RELAYS: fromCsv(import.meta.env.VITE_SEARCH_RELAYS).map(normalizeRelayUrl),
})

export const pubkey = writable<string | null>(null)
export const sessions = writable<Record<string, Session>>({})
