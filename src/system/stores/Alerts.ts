import {sortBy} from "ramda"
import type {Writable, Readable} from "svelte/store"
import {Tags, isLike, findReplyId, findRootId} from "src/util/nostr"
import {derived} from "svelte/store"
import type {Table} from "src/util/loki"
import type {Sync} from "src/system/components/Sync"
import type {Event} from "src/system/types"

export type AlertsOpts = {
  getUserPubkey: () => null | string
  isUserEvent: (e: Event) => boolean
  isMuted: (e: Event) => boolean
}

export class Alerts {
  events: Table<Event>
  lastChecked: Writable<number>
  latestNotification: Writable<number>
  hasNewNotfications: Readable<boolean>
  constructor(sync: Sync, readonly opts: AlertsOpts) {
    this.events = sync.table("alerts/events", "id", {sort: sortBy(e => -e.created_at)})
    this.lastChecked = sync.store("alerts/lastChecked", 0)
    this.latestNotification = sync.store("alerts/latestNotification", 0)

    this.hasNewNotfications = derived(
      [this.lastChecked, this.latestNotification],
      ([$lastChecked, $latestNotification]) => $latestNotification > $lastChecked
    )

    const isMention = e => Tags.from(e).pubkeys().includes(this.opts.getUserPubkey())
    const isDescendant = e => this.opts.isUserEvent(findRootId(e))
    const isReply = e => this.opts.isUserEvent(findReplyId(e))

    const handleNotification = condition => e => {
      if (!this.opts.getUserPubkey() || e.pubkey === this.opts.getUserPubkey()) {
        return
      }

      if (!condition(e)) {
        return
      }

      if (this.opts.isMuted(e)) {
        return
      }

      if (!this.events.get(e.id)) {
        this.events.patch(e)
      }
    }

    sync.addHandler(
      1,
      handleNotification(e => isMention(e) || isReply(e) || isDescendant(e))
    )

    sync.addHandler(
      7,
      handleNotification(e => isLike(e.content) && isReply(e))
    )

    sync.addHandler(9735, handleNotification(isReply))
  }
}
