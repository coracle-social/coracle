import {reduce} from "ramda"
import {Tags, noteKinds, isLike, findReplyId, findRootId} from "src/util/nostr"
import {collection, writable, derived} from "../util/store"
import type {Event} from "src/engine/types"

export class Alerts {
  static contributeState() {
    const events = collection<Event>("id")

    const lastChecked = writable(0)

    const latestNotification = events.derived(reduce((n, e) => Math.max(n, e.created_at), 0))

    const hasNewNotfications = derived(
      [lastChecked, latestNotification],
      ([$lastChecked, $latestNotification]) => $latestNotification > $lastChecked
    )

    return {events, lastChecked, latestNotification, hasNewNotfications}
  }

  static initialize({Alerts, Events, Keys, User}) {
    const isMention = e => Tags.from(e).pubkeys().includes(Keys.pubkey.get())

    const isUserEvent = id => Events.cache.key(id).get()?.pubkey === Keys.pubkey.get()

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

      Alerts.events.key(e.id).set(e)
    }

    noteKinds.forEach(kind => {
      Events.addHandler(
        kind,
        handleNotification(e => isMention(e) || isReply(e) || isDescendant(e))
      )
    })

    Events.addHandler(
      7,
      handleNotification(e => isLike(e.content) && isReply(e))
    )

    Events.addHandler(9735, handleNotification(isReply))
  }
}
