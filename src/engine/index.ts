import {prop, sortBy} from "ramda"
import {Storage, LocalStorageAdapter, IndexedDBAdapter, sortByPubkeyWhitelist} from "./core"
import {lists} from "./lists"
import {people} from "./people"
import {relays} from "./relays"
import {labels} from "./labels"
import {topics} from "./topics"
import {deletes, events} from "./events"
import {pubkey, sessions} from "./session"
import {notificationsLastChecked} from "./notifications"
import {
  channels,
  nip04ChannelsLastChecked,
  nip24ChannelsLastChecked,
  nip28ChannelsLastJoined,
} from "./channels"

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
  new LocalStorageAdapter("notificationsLastChecked", notificationsLastChecked),
  new LocalStorageAdapter("nip04ChannelsLastChecked", nip04ChannelsLastChecked),
  new LocalStorageAdapter("nip24ChannelsLastChecked", nip24ChannelsLastChecked),
  new LocalStorageAdapter("nip28ChannelsLastJoined", nip28ChannelsLastJoined),
  new IndexedDBAdapter("deletes", deletes, 10000),
  new IndexedDBAdapter("events", events, 10000, sortByPubkeyWhitelist(prop("created_at"))),
  new IndexedDBAdapter("labels", labels, 10000, sortBy(prop("created_at"))),
  new IndexedDBAdapter("topics", topics, 10000, sortBy(prop("last_seen"))),
  new IndexedDBAdapter("lists", lists, 10000, sortByPubkeyWhitelist(prop("created_at"))),
  new IndexedDBAdapter("people", people, 10000, sortByPubkeyWhitelist(prop("last_fetched"))),
  new IndexedDBAdapter("relays", relays, 10000, sortBy(prop("count"))),
  new IndexedDBAdapter("channels", channels, 10000, sortBy(prop("last_checked"))),
])
