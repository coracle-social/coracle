import {identity} from "ramda"

export const DUFFLEPUD_URL = import.meta.env.VITE_DUFFLEPUD_URL

export const MULTIPLEXTR_URL = import.meta.env.VITE_MULTIPLEXTR_URL

export const FORCE_RELAYS = (import.meta.env.VITE_FORCE_RELAYS || "").split(",").filter(identity)

export const COUNT_RELAYS = FORCE_RELAYS.length > 0 ? FORCE_RELAYS : ["wss://rbr.bio"]

export const SEARCH_RELAYS = FORCE_RELAYS.length > 0 ? FORCE_RELAYS : ["wss://relay.nostr.band"]

export const DEFAULT_RELAYS =
  FORCE_RELAYS.length > 0
    ? FORCE_RELAYS
    : [
        "wss://purplepag.es",
        "wss://relay.damus.io",
        "wss://relay.nostr.band",
        "wss://nostr-pub.wellorder.net",
      ]

export const DEFAULT_FOLLOWS = (import.meta.env.VITE_DEFAULT_FOLLOWS || "")
  .split(",")
  .filter(identity)

export const ENABLE_ZAPS = JSON.parse(import.meta.env.VITE_ENABLE_ZAPS)
