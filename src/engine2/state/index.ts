import {whereEq, find} from "ramda"
import {collection, derived, writable} from "src/engine2/util/store"
import type {
  Event,
  KeyState,
  Topic,
  List,
  Profile,
  GraphEntry,
  Relay,
  RelayPolicy,
  Handle,
  Zapper,
} from "src/engine2/model"
import {deriveNDK} from "src/engine2/state/ndk"
import {deriveSigner} from "src/engine2/state/signer"
import {deriveCrypto} from "src/engine2/state/crypto"
import {deriveWrapper} from "src/engine2/state/wrapper"

// Sync stores

export const keys = writable<KeyState[]>([])
export const pubkey = writable<string | null>(null)
export const settings = writable<Record<string, any>>({})

// Async stores

export const events = collection<Event>("id")
export const topics = collection<Topic>("name")
export const lists = collection<List>("naddr")
export const profiles = collection<Profile>("pubkey")
export const socialGraph = collection<GraphEntry>("pubkey")
export const handles = collection<Handle>("pubkey")
export const zappers = collection<Zapper>("pubkey")
export const relays = collection<Relay>("url")
export const relayPolicies = collection<RelayPolicy>("pubkey")

// Derived state

export const user = derived([pubkey, keys], ([$pubkey, $keys]) => {
  return find(whereEq({pubkey: $pubkey}), $keys)
})

export const ndk = deriveNDK(user)
export const crypto = deriveCrypto({user})
export const signer = deriveSigner({user, ndk})
export const wrapper = deriveWrapper({user, signer, crypto})

// Parameterizable derivations
