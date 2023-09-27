import {prop, sortBy} from "ramda"
import {Storage, LocalStorageAdapter, IndexedDBAdapter, sortByPubkeyWhitelist} from "./core"
import {_lists} from "./lists"
import {people} from "./people"
import {relays} from "./relays"
import {_labels} from "./labels"
import {topics} from "./topics"
import {deletes, _events, deletesLastUpdated} from "./events"
import {pubkey, sessions} from "./session"
import {channels} from "./channels"

export * from "./core"
export * from "./channels"
export * from "./events"
export * from "./labels"
export * from "./lists"
export * from "./media"
export * from "./network"
export * from "./notes"
export * from "./notifications"
export * from "./people"
export * from "./relays"
export * from "./reports"
export * from "./session"
export * from "./topics"
export * from "./zaps"

export const storage = new Storage([
  new LocalStorageAdapter("pubkey", pubkey),
  new LocalStorageAdapter("sessions", sessions),
  new LocalStorageAdapter("deletes2", deletes, {
    dump: s => Array.from(s),
    load: a => new Set(a || []),
  }),
  new LocalStorageAdapter("deletesLastUpdated2", deletesLastUpdated),
  new IndexedDBAdapter("events", _events, 10000, sortByPubkeyWhitelist(prop("created_at"))),
  new IndexedDBAdapter("labels", _labels, 10000, sortBy(prop("created_at"))),
  new IndexedDBAdapter("topics", topics, 10000, sortBy(prop("last_seen"))),
  new IndexedDBAdapter("lists", _lists, 10000, sortByPubkeyWhitelist(prop("created_at"))),
  new IndexedDBAdapter("people", people, 10000, sortByPubkeyWhitelist(prop("last_fetched"))),
  new IndexedDBAdapter("relays", relays, 10000, sortBy(prop("count"))),
  new IndexedDBAdapter("channels", channels, 10000, sortBy(prop("last_checked"))),
])
