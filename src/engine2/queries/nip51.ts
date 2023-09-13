import {find, whereEq, nth} from "ramda"
import {derived} from "src/engine2/util"
import type {Event} from "src/engine2/model"
import {findReplyAndRootIds} from "src/util/nostr"
import {session, lists} from "src/engine2/state"
import {user} from "src/engine2/queries/session"

export const mutes = user.derived($user => ($user?.mutes || []).map(nth(1)))

export const mutesSet = mutes.derived($mutes => new Set($mutes))

export const isMuted = (value: string) => mutesSet.derived(s => s.has(value))

export const isEventMuted = (e: Event) =>
  mutesSet.derived(s => {
    const {reply, root} = findReplyAndRootIds(e)

    return Boolean(find(t => s.has(t), [e.id, e.pubkey, reply, root]))
  })

export const userLists = derived([session, lists], ([$session, $lists]) =>
  $lists.filter(whereEq({pubkey: $session.pubkey}))
)
