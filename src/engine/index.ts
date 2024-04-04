import type {Event} from "nostr-tools"
import {Tags, hasValidSignature} from "@coracle.social/util"
import {NetworkContext} from "@coracle.social/network"
import {prop, filter, identity, uniq, sortBy} from "ramda"
import {LOCAL_RELAY_URL} from "src/util/nostr"
import {
  Storage,
  projections,
  LocalStorageAdapter,
  IndexedDBAdapter,
  sortByPubkeyWhitelist,
} from "./core"
import {_lists} from "./lists"
import {people} from "./people"
import {relays} from "./relays"
import {groups, groupSharedKeys, groupAdminKeys, groupRequests, groupAlerts} from "./groups"
import {_labels} from "./labels"
import {topics} from "./topics"
import {deletes, seen, _events, isDeleted} from "./events"
import {pubkey, sessions} from "./session"
import {channels} from "./channels"
import {onAuth, getExecutor, tracker} from "./network"

export * from "./core"
export * from "./auth"
export * from "./channels"
export * from "./events"
export * from "./groups"
export * from "./handlers"
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

Object.assign(NetworkContext, {
  onAuth,
  getExecutor,
  onEvent: (url: string, event: Event) => {
    if (!tracker.track(event.id, url)) {
      projections.push(event)
    }
  },
  isDeleted: (url: string, event: Event) => isDeleted.get()(event),
  hasValidSignature: (url: string, event: Event) =>
    url === LOCAL_RELAY_URL ? true : hasValidSignature(event),
})

const setAdapter = {
  dump: s => Array.from(s),
  load: a => new Set(a || []),
}

// Nip 04 channels weren't getting members set
const migrateChannels = channels => {
  return channels.map(c => {
    const members = c.members || []
    const pubkeys =
      c.messages?.flatMap(e => Tags.fromEvent(e).values("p").valueOf().concat(e.pubkey)) || []

    c.members = uniq([...members, ...pubkeys])

    return c
  })
}

// Removed support for bunker login
const sessionsAdapter = {
  load: filter(($s: any) => $s.method !== "bunker"),
  dump: identity,
}

export const storage = new Storage(10, [
  new LocalStorageAdapter("pubkey", pubkey),
  new LocalStorageAdapter("sessions", sessions, sessionsAdapter),
  new LocalStorageAdapter("deletes2", deletes, setAdapter),
  new IndexedDBAdapter("seen3", seen, 10000, sortBy(prop("created_at"))),
  new IndexedDBAdapter("events", _events, 10000, sortByPubkeyWhitelist(prop("created_at"))),
  new IndexedDBAdapter("labels", _labels, 1000, sortBy(prop("created_at"))),
  new IndexedDBAdapter("topics", topics, 1000, sortBy(prop("last_seen"))),
  new IndexedDBAdapter(
    "lists",
    _lists,
    1000,
    sortByPubkeyWhitelist(prop("created_at")),
    l => l.address,
  ),
  new IndexedDBAdapter("people", people, 5000, sortByPubkeyWhitelist(prop("last_fetched"))),
  new IndexedDBAdapter("relays", relays, 1000, sortBy(prop("count"))),
  new IndexedDBAdapter(
    "channels",
    channels,
    1000,
    sortBy(prop("last_checked")),
    null,
    migrateChannels,
  ),
  new IndexedDBAdapter("groups", groups, 1000, sortBy(prop("count"))),
  new IndexedDBAdapter("groupAlerts", groupAlerts, 30, sortBy(prop("created_at"))),
  new IndexedDBAdapter("groupRequests", groupRequests, 100, sortBy(prop("created_at"))),
  new IndexedDBAdapter("groupSharedKeys", groupSharedKeys, 1000, sortBy(prop("created_at"))),
  new IndexedDBAdapter("groupAdminKeys", groupAdminKeys, 1000),
])
