import {Tags, getIdAndAddress} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import {whereEq, groupBy, find} from "ramda"
import {derived, DerivedCollection} from "@welshman/lib"
import {pubkey} from "src/engine/session/state"
import {settings} from "src/engine/session/derived"
import {getWotScore} from "src/engine/people/utils"
import {mutes, follows} from "src/engine/people/derived"
import {deriveIsGroupMember} from "src/engine/groups/utils"
import {deletes, seen, _events} from "./state"

export const events = new DerivedCollection<TrustedEvent>("id", [_events, deletes], ([$e, $d]) =>
  $e.filter(e => !$d.has(e.id)),
)

export const userEvents = new DerivedCollection<TrustedEvent>(
  "id",
  [events, pubkey],
  ([$e, $pk]) => {
    return $pk ? $e.filter(whereEq({pubkey: $pk})) : []
  },
)

export const eventsByKind = events.derived(groupBy((e: TrustedEvent) => String(e.kind)))

export const isEventMuted = derived([mutes, settings, pubkey], ([$mutes, $settings, $pubkey]) => {
  const words = $settings.muted_words
  const minWot = $settings.min_wot_score
  const $follows = follows.get()
  const regex =
    words.length > 0 ? new RegExp(`\\b(${words.map(w => w.toLowerCase()).join("|")})\\b`) : null

  return (e: Partial<TrustedEvent>, strict = false) => {
    if (!$pubkey || e.pubkey === $pubkey) {
      return false
    }

    const tags = Tags.wrap(e.tags || [])
    const {roots, replies} = tags.ancestors()

    if (
      find(
        t => $mutes.has(t),
        [e.id, e.pubkey, ...roots.values().valueOf(), ...replies.values().valueOf()],
      )
    ) {
      return true
    }

    if (regex && e.content?.toLowerCase().match(regex)) {
      return true
    }

    if (strict) {
      return false
    }

    const isGroupMember = tags
      .groups()
      .values()
      .some(a => deriveIsGroupMember(a).get())
    const isCommunityMember = tags
      .communities()
      .values()
      .some(a => false)
    const wotAdjustment = isCommunityMember || isGroupMember ? 1 : 0

    if (!$follows.has(e.pubkey) && getWotScore($pubkey, e.pubkey) < minWot - wotAdjustment) {
      return true
    }

    return false
  }
})

export const isDeleted = deletes.derived(
  $d => e => Boolean(getIdAndAddress(e).find(k => $d.has(k))),
)

export const isSeen = seen.mapStore.derived($m => e => $m.has(e.id))
