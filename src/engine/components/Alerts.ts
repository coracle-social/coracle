import {Tags, isLike, findReplyId, findRootId} from "src/util/nostr"
import {collection, writable, derived} from "../util/store"
import type {Event} from "src/engine/types"

export class Alerts {
  static contributeState() {
    const events = collection<Event>()

    const lastChecked = writable(0)

    const latestNotification = writable(0)

    const hasNewNotfications = derived(
      [lastChecked, latestNotification],
      ([$lastChecked, $latestNotification]) => $latestNotification > $lastChecked
    )

    return {events, lastChecked, latestNotification, hasNewNotfications}
  }

  static initialize({Alerts, Events, Keys, User}) {
    const isMention = e => Tags.from(e).pubkeys().includes(Keys.pubkey.get())

    const isUserEvent = id => Events.cache.getKey(id)?.pubkey === Keys.pubkey.get()

    const isDescendant = e => isUserEvent(findRootId(e))

    const isReply = e => isUserEvent(findReplyId(e))

    const handleNotification = condition => e => {
      const pubkey = Keys.pubkey.get()

      if (!pubkey || e.pubkey === pubkey) {
        return
      }

      if (!condition(e)) {
        return
      }

      if (User.isMuted(e)) {
        return
      }

      if (!Alerts.events.getKey(e.id)) {
        Alerts.events.setKey(e.id, e)
      }
    }

    Events.addHandler(
      1,
      handleNotification(e => isMention(e) || isReply(e) || isDescendant(e))
    )

    Events.addHandler(
      7,
      handleNotification(e => isLike(e.content) && isReply(e))
    )

    Events.addHandler(9735, handleNotification(isReply))
  }
}
