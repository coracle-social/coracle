import {prop, sortBy} from "ramda"
import * as state from "src/engine2/state"
import {deriveFollowsSet} from "src/engine2/queries"
import {Storage, LocalStorageAdapter, IndexedDBAdapter} from "./util"

const sortByPubkeyWhitelist = (fallback: (x: any) => number) => (rows: Record<string, any>[]) => {
  const pubkeys = new Set(state.keys.get().map(prop("pubkey")))
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
  new LocalStorageAdapter("Keys.keyState", state.keys),
  new LocalStorageAdapter("Keys.pubkey", state.pubkey),
  new LocalStorageAdapter("settings", state.settings),
  new IndexedDBAdapter("events", state.events, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
  new IndexedDBAdapter("topics", state.topics, {
    max: 10000,
    sort: sortBy(prop("created_at")),
  }),
  new IndexedDBAdapter("lists", state.lists, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
  new IndexedDBAdapter("people", state.people, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("last_fetched")),
  }),
  new IndexedDBAdapter("relays", state.relays, {
    max: 10000,
    sort: sortBy(prop("created_at")),
  }),
])
