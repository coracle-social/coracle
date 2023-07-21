import {identity} from "ramda"
import {Engine} from "src/engine"

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

const engine = new Engine({
  DUFFLEPUD_URL,
  MULTIPLEXTR_URL,
  FORCE_RELAYS,
  COUNT_RELAYS,
  SEARCH_RELAYS,
  DEFAULT_RELAYS,
  ENABLE_ZAPS,
})

export default engine
export const Alerts = engine.components.Alerts
export const Builder = engine.components.Builder
export const Content = engine.components.Content
export const Crypt = engine.components.Crypt
export const Directory = engine.components.Directory
export const Events = engine.components.Events
export const Keys = engine.components.Keys
export const Meta = engine.components.Meta
export const Network = engine.components.Network
export const Nip02 = engine.components.Nip02
export const Nip04 = engine.components.Nip04
export const Nip05 = engine.components.Nip05
export const Nip28 = engine.components.Nip28
export const Nip57 = engine.components.Nip57
export const Nip65 = engine.components.Nip65
export const Outbox = engine.components.Outbox
export const PubkeyLoader = engine.components.PubkeyLoader
export const Storage = engine.components.Storage
export const User = engine.components.User
export const alerts = engine.components.Alerts
export const builder = engine.components.Builder
export const content = engine.components.Content
export const directory = engine.components.Directory
export const events = engine.components.Events
export const keys = engine.components.Keys
export const meta = engine.components.Meta
export const network = engine.components.Network
export const nip02 = engine.components.Nip02
export const nip04 = engine.components.Nip04
export const nip05 = engine.components.Nip05
export const nip28 = engine.components.Nip28
export const nip57 = engine.components.Nip57
export const nip65 = engine.components.Nip65
export const outbox = engine.components.Outbox
export const pubkeyLoader = engine.components.PubkeyLoader
export const storage = engine.components.Storage
export const user = engine.components.User
