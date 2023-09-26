import {whereEq, find} from "ramda"
import {findReplyAndRootIds} from "src/util/nostr"
import {derived, DerivedCollection} from "src/engine/core/utils"
import {pubkey} from "src/engine/session/state"
import {settings} from "src/engine/session/derived"
import {mutes} from "src/engine/people/derived"
import type {Event} from "./model"
import {deletes, _events} from "./state"

export const events = new DerivedCollection<Event>("id", [_events, deletes], ([$e, $d]) =>
  $e.filter(e => !$d.has(e.id))
)

export const userEvents = new DerivedCollection<Event>("id", [events, pubkey], ([$e, $pk]) => {
  return $pk ? $e.filter(whereEq({pubkey: $pk})) : []
})

export const isEventMuted = derived([mutes, settings], ([$mutes, $settings]) => {
  const words = $settings.muted_words
  const regex =
    words.length > 0 ? new RegExp(`\\b(${words.map(w => w.toLowerCase()).join("|")})\\b`) : null

  return (e: Event) => {
    const {reply, root} = findReplyAndRootIds(e)

    if (find(t => $mutes.has(t), [e.id, e.pubkey, reply, root])) {
      return true
    }

    if (regex && e.content?.toLowerCase().match(regex)) {
      return true
    }

    return false
  }
})
