import {pluck, all, identity} from "ramda"
import {derived} from "svelte/store"
import {Table, registry} from "src/agent/storage"

export const userEvents = new Table("userEvents", "id")
export const people = new Table("people", "pubkey")
export const contacts = new Table("contacts", "pubkey")
export const rooms = new Table("rooms", "id")
export const alerts = new Table("alerts", "id")
export const relays = new Table("relays", "url")
export const routes = new Table("routes", "id")

export const getPersonWithFallback = pubkey => people.get(pubkey) || {pubkey}

export const ready = derived(pluck("ready", Object.values(registry)), all(identity))

export const onReady = cb => {
  const unsub = ready.subscribe($ready => {
    if ($ready) {
      cb()
      setTimeout(() => unsub())
    }
  })
}
