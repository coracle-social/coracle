import {find, nth} from "ramda"
import type {Event} from "src/engine2/model"
import {findReplyId, findRootId} from "src/util/nostr"
import {user} from "src/engine2/queries"

export const isMuted = (e: Event) => {
  const m = new Set((user.get().mutes || []).map(nth(1)))

  return Boolean(find(t => m.has(t), [e.id, e.pubkey, findReplyId(e), findRootId(e)]))
}
