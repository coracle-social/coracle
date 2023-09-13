import {Tags, isLike, noteKinds, findReplyId, findRootId} from "src/util/nostr"
import type {Event} from "src/engine2/model"
import {session, events, alerts} from "src/engine2/state"
import {projections} from "src/engine2/projections/core"

const isMention = (e: Event) => Tags.from(e).pubkeys().includes(session.get()?.pubkey)

const isUserEvent = (id: string) => events.key(id).get()?.pubkey === session.get()?.pubkey

const isDescendant = (e: Event) => isUserEvent(findRootId(e))

const isReply = (e: Event) => isUserEvent(findReplyId(e))

const handleNotification = (e: Event) => {
  const $session = session.get()

  if (!$session || e.pubkey === $session.pubkey) {
    return
  }

  alerts.key(e.id).set({...e, recipient: $session.pubkey})
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
