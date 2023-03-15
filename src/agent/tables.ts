import {pluck, all, identity} from "ramda"
import {derived} from "svelte/store"
import {Table, listener, registry} from "src/agent/storage"

// Temporarily put no upper bound on people for 0.2.18 migration
export const people = new Table("people", "pubkey", {maxEntries: 100000})
export const contacts = new Table("contacts", "pubkey")
export const rooms = new Table("rooms", "id")
export const alerts = new Table("alerts", "id")
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
