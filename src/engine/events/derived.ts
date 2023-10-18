import {whereEq, groupBy, find} from "ramda"
import {Tags} from "paravel"
import {derived, DerivedCollection} from "src/engine/core/utils"
import {pubkey} from "src/engine/session/state"
import {settings} from "src/engine/session/derived"
import {getWotScore} from "src/engine/people/utils"
import {mutes, follows} from "src/engine/people/derived"
import {deriveGroupAccess} from "src/engine/groups/utils"
import type {Event} from "./model"
import {deletes, _events} from "./state"

export const events = new DerivedCollection<Event>("id", [_events, deletes], ([$e, $d]) =>
  $e.filter(e => !$d.has(e.id))
)

export const userEvents = new DerivedCollection<Event>("id", [events, pubkey], ([$e, $pk]) => {
  return $pk ? $e.filter(whereEq({pubkey: $pk})) : []
})

export const eventsByKind = events.derived(groupBy((e: Event) => String(e.kind)))

export const isEventMuted = derived([mutes, settings, pubkey], ([$mutes, $settings, $pubkey]) => {
  const words = $settings.muted_words
  const minWot = $settings.min_wot_score
  const $follows = follows.get()
  const regex =
    words.length > 0 ? new RegExp(`\\b(${words.map(w => w.toLowerCase()).join("|")})\\b`) : null

  return (e: Event, strict = false) => {
    if (!$pubkey || e.pubkey === $pubkey) {
      return false
    }

    const tags = Tags.from(e)
    const reply = tags.getReply()
    const root = tags.getRoot()

    if (find(t => $mutes.has(t), [e.id, e.pubkey, reply, root])) {
      return true
    }

    if (regex && e.content?.toLowerCase().match(regex)) {
      return true
    }

    if (strict) {
      return false
    }

    const address = tags.getCommunity()
    const wotAdjustment = address && deriveGroupAccess(address) ? 1 : 0

    if (!$follows.has(e.pubkey) && getWotScore($pubkey, e.pubkey) < minWot - wotAdjustment) {
      return true
    }

    return false
  }
})
