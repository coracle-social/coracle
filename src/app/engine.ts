import {identity} from "ramda"
import {Engine, User} from "src/engine"

const IMGPROXY_URL = import.meta.env.VITE_IMGPROXY_URL

const DUFFLEPUD_URL = import.meta.env.VITE_DUFFLEPUD_URL

const MULTIPLEXTR_URL = import.meta.env.VITE_MULTIPLEXTR_URL

const FORCE_RELAYS = (import.meta.env.VITE_FORCE_RELAYS || "").split(",").filter(identity)

const COUNT_RELAYS = FORCE_RELAYS.length > 0 ? FORCE_RELAYS : ["wss://rbr.bio"]

const SEARCH_RELAYS = FORCE_RELAYS.length > 0 ? FORCE_RELAYS : ["wss://relay.nostr.band"]

const DEFAULT_RELAYS =
  FORCE_RELAYS.length > 0
    ? FORCE_RELAYS
    : [
        "wss://purplepag.es",
        "wss://relay.damus.io",
        "wss://relay.nostr.band",
        "wss://relayable.org",
        "wss://nostr.wine",
      ]

const DEFAULT_FOLLOWS = (import.meta.env.VITE_DEFAULT_FOLLOWS || "").split(",").filter(identity)

const ENABLE_ZAPS = JSON.parse(import.meta.env.VITE_ENABLE_ZAPS)

const engine = new Engine({
  DEFAULT_FOLLOWS,
  IMGPROXY_URL,
  DUFFLEPUD_URL,
  MULTIPLEXTR_URL,
  FORCE_RELAYS,
  COUNT_RELAYS,
  SEARCH_RELAYS,
  DEFAULT_RELAYS,
  ENABLE_ZAPS,
})

export const user = new User(engine)

export default engine
export const Env = engine.Env
export const Builder = engine.Builder
export const Content = engine.Content
export const Crypt = engine.Crypt
export const Directory = engine.Directory
export const Events = engine.Events
export const Keys = engine.Keys
export const Network = engine.Network
export const Nip02 = engine.Nip02
export const Nip04 = engine.Nip04
export const Nip05 = engine.Nip05
export const Nip24 = engine.Nip24
export const Nip28 = engine.Nip28
export const Nip44 = engine.Nip44
export const Nip57 = engine.Nip57
export const Nip59 = engine.Nip59
export const Nip65 = engine.Nip65
export const Outbox = engine.Outbox
