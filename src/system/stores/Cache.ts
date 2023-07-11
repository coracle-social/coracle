import type {Event as NostrToolsEvent} from "nostr-tools"
import {sortBy} from "ramda"
import type {Table} from "src/util/loki"

export type Event = NostrToolsEvent & {
  seen_on: string[]
}

export class Cache {
  events: Table<Event>
  constructor(sync) {
    this.events = sync.table("cache/events", "id", {
      max: 5000,
      sort: events => {
        const sortByPubkeyWhitelist = e =>
          sync.getUserPubkey() === e.pubkey ? 0 : Number.MAX_SAFE_INTEGER - e.created_at

        return sortBy(sortByPubkeyWhitelist, events)
      },
    })

    sync.addHandler(sync.ANY_KIND, e => {
      if (e.pubkey === sync.getUserPubkey() && !this.events.get(e.id)) {
        this.events.patch(e)
      }
    })
  }
}
