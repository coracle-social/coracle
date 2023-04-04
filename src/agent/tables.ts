import {sortBy, pluck, all, identity} from "ramda"
import {derived} from "svelte/store"
import Cache from "src/util/cache"
import {Tags} from "src/util/nostr"
import {Table, listener, registry} from "src/agent/storage"
import user from "src/agent/user"

const sortByCreatedAt = sortBy(([k, x]) => x.value.created_at)
const sortByLastSeen = sortBy(([k, x]) => x.value.last_seen)

export const people = new Table("people", "pubkey", {
  cache: new Cache({
    max: 5000,
    // Don't delete the user's own profile or those of direct follows
    sort: xs => {
      const follows = Tags.wrap(user.getPetnames()).values().all()
      const whitelist = new Set(follows.concat(user.getPubkey()))

      return sortBy(([k, {lru, value}]) => (whitelist.has(value.pubkey) ? 0 : value.created_at), xs)
    },
  }),
})

export const userEvents = new Table("userEvents", "id", {
  cache: new Cache({max: 2000, sort: sortByCreatedAt}),
})

export const notifications = new Table("notifications", "id")
export const contacts = new Table("contacts", "pubkey")
export const rooms = new Table("rooms", "id")
export const relays = new Table("relays", "url")
export const routes = new Table("routes", "id", {
  cache: new Cache({max: 3000, sort: sortByLastSeen}),
})

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
