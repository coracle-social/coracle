import {Tags, isLike, noteKinds, findReplyId, findRootId} from "src/util/nostr"
import type {Event} from "src/engine2/model"
import {pubkey, events, alerts} from "src/engine2/state"
import {projections} from "src/engine2/projections/core"

const isMention = (e: Event) => Tags.from(e).pubkeys().includes(pubkey.get())

const isUserEvent = (id: string) => events.key(id).get()?.pubkey === pubkey.get()

const isDescendant = (e: Event) => isUserEvent(findRootId(e))

const isReply = (e: Event) => isUserEvent(findReplyId(e))

const handleNotification = (e: Event) => {
  const $pubkey = pubkey.get()

  if (!$pubkey || e.pubkey === $pubkey) {
    return
  }

  alerts.key(e.id).set({...e, recipient: $pubkey})
}

noteKinds.forEach(kind => {
  projections.addHandler(kind, (e: Event) => {
    if (isMention(e) || isReply(e) || isDescendant(e)) {
      handleNotification(e)
    }
  })
})

projections.addHandler(7, (e: Event) => {
  if (isLike(e.content) && isReply(e)) {
    handleNotification(e)
  }
})

projections.addHandler(9735, (e: Event) => {
  if (isReply(e)) {
    handleNotification(e)
  }
})
