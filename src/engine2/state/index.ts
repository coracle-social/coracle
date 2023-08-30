import {sortBy, nth, map, whereEq, prop, find} from "ramda"
import {ensurePlural} from "hurdak"
import {collection, derived, writable} from "src/engine2/util/store"
import {LocalStorageAdapter, IndexedDBAdapter, Storage} from "src/engine2/util/storage"
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

// Derived state

export const user = derived([pubkey, keys], ([$pubkey, $keys]) => {
  return find(whereEq({pubkey: $pubkey}), $keys)
})

export const ndk = deriveNDK(user)
export const crypto = deriveCrypto({user})
export const signer = deriveSigner({user, ndk})
export const wrapper = deriveWrapper({user, signer, crypto})

// Parameterizable derivations

export const derivePetnames = (pubkey: string) =>
  socialGraph.key(pubkey).derived(g => g?.petnames || [])

export const deriveMutes = (pubkey: string) => socialGraph.key(pubkey).derived(g => g?.mutes || [])

export const deriveFollowsSet = (pubkeys: string | string[]) =>
  derived(
    ensurePlural(pubkeys).map(derivePetnames),
    petnameGroups => new Set(petnameGroups.flatMap(map(nth(1))))
  )

export const deriveMutesSet = (pubkeys: string | string[]) =>
  derived(
    ensurePlural(pubkeys).map(deriveMutes),
    petnameGroups => new Set(petnameGroups.flatMap(map(nth(1))))
  )

// Synchronization to local storage and indexeddb

const sortByPubkeyWhitelist = (fallback: (x: any) => number) => (rows: Record<string, any>[]) => {
  const pubkeys = new Set(keys.get().map(prop("pubkey")))
  const follows = deriveFollowsSet(Array.from(pubkeys)).get()

  return sortBy(x => {
    if (pubkeys.has(x.pubkey)) {
      return Number.MAX_SAFE_INTEGER
    }

    if (follows.has(x.pubkey)) {
      return Number.MAX_SAFE_INTEGER - 1
    }

    return fallback(x)
  }, rows)
}

export const storage = new Storage([
  new LocalStorageAdapter("Keys.keyState", keys),
  new LocalStorageAdapter("Keys.pubkey", pubkey),
  new LocalStorageAdapter("settings", settings),
  new IndexedDBAdapter("events", events, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
  new IndexedDBAdapter("topics", topics, {
    max: 1000,
    sort: sortBy(prop("created_at")),
  }),
  new IndexedDBAdapter("lists", lists, {
    max: 1000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
  new IndexedDBAdapter("profiles", profiles, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
  new IndexedDBAdapter("socialGraph", socialGraph, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
  new IndexedDBAdapter("handles", handles, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
  new IndexedDBAdapter("zappers", zappers, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
  new IndexedDBAdapter("relays", relays, {
    max: 1000,
    sort: sortBy(prop("created_at")),
  }),
  new IndexedDBAdapter("relayPolicies", relayPolicies, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
])
