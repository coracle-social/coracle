import {sortBy} from "ramda"
import type {Writable, Readable} from "svelte/store"
import {synced} from "src/util/misc"
import {Tags, isLike, findReplyId, findRootId} from "src/util/nostr"
import {derived} from "svelte/store"
import {Table, watch} from "src/util/loki"
import type {System} from "src/system/system"

export class Alerts {
  system: System
  events: Table<Event>
  lastChecked: Writable<number>
  latestNotification: Writable<number>
  hasNewNotfications: Readable<boolean>
  hasNewDirectMessages: Readable<boolean>
  hasNewChatMessages: Readable<boolean>
  constructor(system) {
    this.system = system
    this.events = new Table(system.key("alerts/events"), "id", {sort: sortBy(e => -e.created_at)})
    this.lastChecked = synced(system.key("alerts/lastChecked"), 0)
    this.latestNotification = synced(system.key("alerts/latestNotification"), 0)

    const isMention = e =>
      Tags.from(e).type("p").values().all().includes(system.user.getPubkey())
    const isReply = e => system.user.isUserEvent(findReplyId(e))
    const isDescendant = e => system.user.isUserEvent(findRootId(e))

    const handleNotification = condition => e => {
      if (!system.user.getPubkey()) {
        return
      }

      if (e.pubkey === system.user.getPubkey()) {
        return
      }

      if (!condition(e)) {
        return
      }

      if (system.user.isMuted(e)) {
        return
      }

      if (!this.events.get(e.id)) {
        this.events.patch(e)
      }
    }

    system.sync.addHandler(
      1,
      handleNotification(e => isMention(e) || isReply(e) || isDescendant(e))
    )

    system.sync.addHandler(
      7,
      handleNotification(e => isLike(e.content) && isReply(e))
    )

    system.sync.addHandler(9735, handleNotification(isReply))

    this.hasNewNotfications = derived(
      [this.lastChecked, this.latestNotification],
      ([$lastChecked, $latestNotification]) => $latestNotification > $lastChecked
    )

    this.hasNewDirectMessages = watch(system.chat.channels, () => {
      const channels = system.chat.channels.all({type: "private", last_sent: {$type: "number"}})

      return channels.filter(this.messageIsNew).length > 0
    })

    this.hasNewChatMessages = watch(system.chat.channels, () => {
      const channels = system.chat.channels.all({type: "public", joined: true})

      return channels.filter(this.messageIsNew).length > 0
    })
  }

  messageIsNew = ({last_checked, last_received, last_sent}) =>
    last_received > Math.max(last_sent || 0, last_checked || 0)
}
