import {prop, nth, sortBy} from "ramda"
import * as state from "src/engine2/state"
import {Storage, LocalStorageAdapter, IndexedDBAdapter} from "./util"

const sortByPubkeyWhitelist = (fallback: (x: any) => number) => (rows: Record<string, any>[]) => {
  const pubkeys = new Set(Object.values(state.sessions.get()).map(prop("pubkey")))
  const follows = new Set(
    Array.from(pubkeys)
      .flatMap((pk: string) => state.people.key(pk).get().petnames || [])
      .map(nth(1))
  )

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
  new LocalStorageAdapter("pubkey", state.pubkey),
  new LocalStorageAdapter("sessions", state.sessions),
  new LocalStorageAdapter("notificationsLastChecked", state.notificationsLastChecked),
  new LocalStorageAdapter("nip04ChannelsLastChecked", state.nip04ChannelsLastChecked),
  new LocalStorageAdapter("nip24ChannelsLastChecked", state.nip24ChannelsLastChecked),
  new IndexedDBAdapter("events", state.events, {
    max: 10000,
    sort: sortByPubkeyWhitelist(prop("created_at")),
  }),
  new IndexedDBAdapter("deletes", state.deletes, {max: 10000}),
  new IndexedDBAdapter("labels", state.labels, {
    max: 10000,
    sort: sortBy(prop("created_at")),
  }),
  new IndexedDBAdapter("topics", state.topics, {
    max: 10000,
    sort: sortBy(prop("last_seen")),
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
    sort: sortBy(prop("count")),
  }),
  new IndexedDBAdapter("channels", state.channels, {
    max: 10000,
    sort: sortBy(prop("last_checked")),
  }),
])
