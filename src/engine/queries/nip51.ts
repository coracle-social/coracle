import {find, whereEq, nth} from "ramda"
import {derived} from "src/engine/util"
import type {Event} from "src/engine/model"
import {findReplyAndRootIds} from "src/util/nostr"
import {lists, pubkey} from "src/engine/state"
import {deletesSet} from "src/engine/queries/nip09"
import {user} from "src/engine/queries/session"

export const activeLists = derived([lists, deletesSet], ([$lists, $deletesSet]) =>
  $lists.filter($l => !$deletesSet.has($l.naddr))
)

export const userLists = derived([pubkey, activeLists], ([$pubkey, $activeLists]) =>
  $activeLists.filter(whereEq({pubkey: $pubkey}))
)

export const mutes = user.derived($user => ($user?.mutes || []).map(nth(1)))

export const mutesSet = mutes.derived($mutes => new Set($mutes))

export const isMuted = (value: string) => mutesSet.derived(s => s.has(value))

export const isEventMuted = (e: Event) =>
  mutesSet.derived(s => {
    const {reply, root} = findReplyAndRootIds(e)

    return Boolean(find(t => s.has(t), [e.id, e.pubkey, reply, root]))
  })
