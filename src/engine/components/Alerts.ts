import {reduce} from "ramda"
import {Tags, noteKinds, isLike, findReplyId, findRootId} from "src/util/nostr"
import {collection, writable, derived} from "src/engine/util/store"
import type {Readable} from "src/engine/util/store"
import type {Engine} from "src/engine/Engine"
import type {Event} from "src/engine/types"

export class Alerts {
  events = collection<Event>("id")
  lastChecked = writable(0)
  latestNotification = this.events.derived(reduce((n, e) => Math.max(n, e.created_at), 0))
  hasNewNotfications = derived([this.lastChecked, this.latestNotification], ([c, n]) => n > c)

  initialize(engine: Engine) {
    const {Alerts, Events, Keys, User} = engine.components

    const isMention = (e: Event) => Tags.from(e).pubkeys().includes(Keys.pubkey.get())

    const isUserEvent = (id: string) => Events.cache.key(id).get()?.pubkey === Keys.pubkey.get()

    const isDescendant = (e: Event) => isUserEvent(findRootId(e))

    const isReply = (e: Event) => isUserEvent(findReplyId(e))

    const handleNotification = (e: Event) => {
      const pubkey = Keys.pubkey.get()

      if (!pubkey || e.pubkey === pubkey || User.isMuted(e)) {
        return
      }

      Alerts.events.key(e.id).set(e)
    }

    noteKinds.forEach(kind => {
      Events.addHandler(kind, (e: Event) => {
        if (isMention(e) || isReply(e) || isDescendant(e)) {
          handleNotification(e)
        }
      })
    })

    Events.addHandler(7, (e: Event) => {
      if (isLike(e.content) && isReply(e)) {
        handleNotification(e)
      }
    })

    Events.addHandler(9735, (e: Event) => {
      if (isReply(e)) {
        handleNotification(e)
      }
    })
  }
}
