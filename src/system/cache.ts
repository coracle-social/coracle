import type {Event as NostrToolsEvent} from "nostr-tools"
import {sortBy} from "ramda"
import {Table} from "src/util/loki"
import type {System} from "src/system/system"

export type Event = NostrToolsEvent & {
  seen_on: string[]
}

export class Cache {
  system: System
  events: Table<Event>
  constructor(system) {
    this.system = system

    this.events = new Table(system.key("cache/events"), "id", {
      max: 5000,
      sort: events => {
        const pubkey = system.user.getPubkey()
        const follows = system.user.getFollowsSet()

        return sortBy(e => {
          if (e.pubkey === pubkey) return 0
          if (follows.has(e.pubkey)) return 1

          return Number.MAX_SAFE_INTEGER - e.created_at
        }, events)
      },
    })

    system.sync.addHandler(system.sync.ANY_KIND, e => {
      if (e.pubkey === system.user.getPubkey() && !this.events.get(e.id)) {
        this.events.patch(e)
      }
    })
  }
}
