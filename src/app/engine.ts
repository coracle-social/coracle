import {identity} from "ramda"
import {createDefaultEngine} from "src/engine"

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

const engine = createDefaultEngine({
  DUFFLEPUD_URL,
  MULTIPLEXTR_URL,
  FORCE_RELAYS,
  COUNT_RELAYS,
  SEARCH_RELAYS,
  DEFAULT_RELAYS,
})

export default engine
export const alerts = engine.Alerts
export const builder = engine.Builder
export const content = engine.Content
export const directory = engine.Directory
export const events = engine.Events
export const keys = engine.Keys
export const meta = engine.Meta
export const network = engine.Network
export const nip04 = engine.Nip04
export const nip05 = engine.Nip05
export const nip28 = engine.Nip28
export const nip57 = engine.Nip57
export const pubkeyLoader = engine.PubkeyLoader
export const nip65 = engine.Nip65
export const social = engine.Social
export const storage = engine.Storage
export const user = engine.User
