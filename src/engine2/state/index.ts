import {collection, writable} from "src/engine2/util/store"
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

// Synchronous stores

export const keys = writable<KeyState[]>([])
export const pubkey = writable<string | null>(null)
export const settings = writable<Record<string, any>>({})
export const env = writable<Record<string, any>>({})

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
