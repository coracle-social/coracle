import {identity} from "ramda"
import {DefaultSystem} from "src/system"

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
        "wss://relayable.org",
        "wss://nostr.wine",
      ]

export const DEFAULT_FOLLOWS = (import.meta.env.VITE_DEFAULT_FOLLOWS || "")
  .split(",")
  .filter(identity)

export const ENABLE_ZAPS = JSON.parse(import.meta.env.VITE_ENABLE_ZAPS)

const system = new DefaultSystem("coracle/system", {
  DUFFLEPUD_URL,
  MULTIPLEXTR_URL,
  FORCE_RELAYS,
  COUNT_RELAYS,
  SEARCH_RELAYS,
  DEFAULT_RELAYS,
})

export default system
export const sync = system.sync
export const network = system.network
export const meta = system.meta
export const user = system.user
export const cache = system.cache
export const content = system.content
export const directory = system.directory
export const nip05 = system.nip05
export const nip57 = system.nip57
export const social = system.social
export const routing = system.routing
export const alerts = system.alerts
export const chat = system.chat
export const builder = system.builder
export const pubkeyLoader = system.pubkeyLoader
