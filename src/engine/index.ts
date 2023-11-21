import {prop, sortBy} from "ramda"
import {Storage, LocalStorageAdapter, IndexedDBAdapter, sortByPubkeyWhitelist} from "./core"
import {_lists} from "./lists"
import {people} from "./people"
import {relays} from "./relays"
import {groups, groupSharedKeys, groupAdminKeys, groupRequests, groupAlerts} from "./groups"
import {_labels} from "./labels"
import {topics} from "./topics"
import {deletes, _events, deletesLastUpdated} from "./events"
import {pubkey, sessions} from "./session"
import {channels} from "./channels"

export * from "./core"
export * from "./channels"
export * from "./events"
export * from "./groups"
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

export const storage = new Storage(8, [
  new LocalStorageAdapter("pubkey", pubkey),
  new LocalStorageAdapter("sessions", sessions),
  new LocalStorageAdapter("deletes2", deletes, {
    dump: s => Array.from(s),
    load: a => new Set(a || []),
  }),
  new LocalStorageAdapter("deletesLastUpdated2", deletesLastUpdated),
  new IndexedDBAdapter("events", _events, 10000, sortByPubkeyWhitelist(prop("created_at"))),
  new IndexedDBAdapter("labels", _labels, 1000, sortBy(prop("created_at"))),
  new IndexedDBAdapter("topics", topics, 1000, sortBy(prop("last_seen"))),
  new IndexedDBAdapter("lists", _lists, 1000, sortByPubkeyWhitelist(prop("created_at"))),
  new IndexedDBAdapter("people", people, 5000, sortByPubkeyWhitelist(prop("last_fetched"))),
  new IndexedDBAdapter("relays", relays, 1000, sortBy(prop("count"))),
  new IndexedDBAdapter("channels", channels, 1000, sortBy(prop("last_checked"))),
  new IndexedDBAdapter("groups", groups, 1000, sortBy(prop("count"))),
  new IndexedDBAdapter("groupAlerts", groupAlerts, 30, sortBy(prop("created_at"))),
  new IndexedDBAdapter("groupRequests", groupRequests, 100, sortBy(prop("created_at"))),
  new IndexedDBAdapter("groupSharedKeys", groupSharedKeys, 1000, sortBy(prop("created_at"))),
  new IndexedDBAdapter("groupAdminKeys", groupAdminKeys, 1000),
])
