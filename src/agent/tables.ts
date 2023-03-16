import {sortBy, pluck, all, identity} from "ramda"
import {derived} from "svelte/store"
import Cache from "src/util/cache"
import {Table, listener, registry} from "src/agent/storage"

const sortByCreatedAt = sortBy(([k, x]) => -x.value.created_at)

// Temporarily put no upper bound on people for 0.2.18 migration
export const people = new Table("people", "pubkey", {
  // cache: new Cache({max: 5000}),
  // cache: new Cache({max: 20_000}),
})

export const userEvents = new Table("userEvents", "id", {
  cache: new Cache({max: 5000, sort: sortByCreatedAt}),
})

export const notifications = new Table("notifications", "id")
export const contacts = new Table("contacts", "pubkey")
export const rooms = new Table("rooms", "id")
export const relays = new Table("relays", "url")
export const routes = new Table("routes", "id")

listener.connect()

export const getPersonWithFallback = pubkey => people.get(pubkey) || {pubkey}

const ready = derived(pluck("ready", Object.values(registry)), all(identity))

export const onReady = cb => {
  const unsub = ready.subscribe($ready => {
    if ($ready) {
      cb()
      setTimeout(() => unsub())
    }
  })
}
