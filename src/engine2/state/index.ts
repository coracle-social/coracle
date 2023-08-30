import {sortBy, prop, find, whereEq} from "ramda"
import {derived} from "src/engine2/util/store"
import {LocalStorageAdapter, IndexedDBAdapter, Storage} from "src/engine2/util/storage"
import * as core from "src/engine2/state/core"
import {deriveNDK} from "src/engine2/state/ndk"
import {deriveSigner} from "src/engine2/state/signer"
import {deriveCrypto} from "src/engine2/state/crypto"
import {deriveWrapper} from "src/engine2/state/wrapper"
import {deriveFollowsSet} from "src/engine2/state/nip02"

// Base state

export * from "src/engine2/state/core"

// Derived state

export const user = derived([core.pubkey, core.keys], ([$pubkey, $keys]) => {
  return find(whereEq({pubkey: $pubkey}), $keys)
})

export const ndk = deriveNDK(user)
export const crypto = deriveCrypto({user})
export const signer = deriveSigner({user, ndk})
export const wrapper = deriveWrapper({user, signer, crypto})

// Parameterizable derivations and utility functions

export * from "src/engine2/state/nip02"

// Synchronization to local storage and indexeddb

const sortByPubkeyWhitelist = (fallback: (x: any) => number) => (rows: Record<string, any>[]) => {
  const pubkeys = new Set(core.keys.get().map(prop("pubkey")))
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
  new LocalStorageAdapter("Keys.keyState", core.keys),
  new LocalStorageAdapter("Keys.pubkey", core.pubkey),
  new LocalStorageAdapter("settings", core.settings),
  new IndexedDBAdapter("events", core.events, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
  new IndexedDBAdapter("topics", core.topics, {
    max: 1000,
    sort: sortBy(prop("created_at")),
  }),
  new IndexedDBAdapter("lists", core.lists, {
    max: 1000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
  new IndexedDBAdapter("profiles", core.profiles, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
  new IndexedDBAdapter("socialGraph", core.socialGraph, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
  new IndexedDBAdapter("handles", core.handles, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
  new IndexedDBAdapter("zappers", core.zappers, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
  new IndexedDBAdapter("relays", core.relays, {
    max: 1000,
    sort: sortBy(prop("created_at")),
  }),
  new IndexedDBAdapter("relayPolicies", core.relayPolicies, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
])
