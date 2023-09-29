import {pluck, identity, max, slice, filter, without, sortBy} from "ramda"
import {seconds, batch, doPipe} from "hurdak"
import {now} from "src/util/misc"
import {noteKinds, findReplyId, reactionKinds} from "src/util/nostr"
import type {Event} from "src/engine/events/model"
import type {Filter} from "src/engine/network/model"
import {EventKind} from "src/engine/events/model"
import {env, sessions} from "src/engine/session/state"
import {_events} from "src/engine/events/state"
import {events, isEventMuted} from "src/engine/events/derived"
import {mergeHints, getPubkeyHints, getParentHints} from "src/engine/relays/utils"
import {loadPubkeys, load, subscribe, subscribePersistent} from "src/engine/network/utils"

const onNotificationEvent = batch(300, (chunk: Event[]) => {
  const kinds = getNotificationKinds()
  const $isEventMuted = isEventMuted.get()
  const events = chunk.filter(e => kinds.includes(e.kind) && !$isEventMuted(e))
  const eventsWithParent = chunk.filter(e => findReplyId(e))

  loadPubkeys(pluck("pubkey", events))

  load({
    relays: mergeHints(eventsWithParent.map(getParentHints)),
    filters: [{ids: eventsWithParent.map(findReplyId)}],
    onEvent: e => _events.update($events => $events.concat(e)),
  })

  _events.mapStore.update($m => {
    for (const e of events) {
      $m.set(e.id, e)
    }

    return $m
  })
})

export const getNotificationKinds = () =>
  without(env.get().ENABLE_ZAPS ? [] : [EventKind.Zap], [...noteKinds, ...reactionKinds])

export const loadNotifications = () => {
  const kinds = getNotificationKinds()
  const pubkeys = Object.keys(sessions.get())
  const cutoff = now() - seconds(30, "day")
  const $sessions = Object.values(sessions.get())
  const lastChecked = pluck("notifications_last_synced", $sessions).filter(identity).reduce(max, 0)
  const since = Math.max(cutoff, lastChecked - seconds(1, "day"))

  const eventIds = pluck(
    "id",
    sortBy(
      e => -e.created_at,
      events.get().filter(e => e.created_at > cutoff && pubkeys.includes(e.pubkey))
    ).slice(0, 256)
  )

  const filters = [
    {kinds, "#p": pubkeys, since},
    {kinds, "#e": eventIds, since},
    {kinds, authors: pubkeys, since},
  ]

  return subscribe({
    filters,
    timeout: 15000,
    shouldProject: false,
    relays: mergeHints(pubkeys.map(pk => getPubkeyHints(pk, "read"))),
    onEvent: onNotificationEvent,
  })
}

export const listenForNotifications = async () => {
  const pubkeys = Object.keys(sessions.get())
  const relays = mergeHints(pubkeys.map(pk => getPubkeyHints(pk, "read")))

  const eventIds: string[] = doPipe(events.get(), [
    filter((e: Event) => noteKinds.includes(e.kind)),
    sortBy((e: Event) => -e.created_at),
    slice(0, 256),
    pluck("id"),
  ])

  const filters: Filter[] = [
    // NIP04 Messages
    {kinds: [4], "#p": pubkeys, limit: 1},
    // NIP24 Messages
    {kinds: [1059], "#p": pubkeys, limit: 1},
    // Mentions
    {kinds: noteKinds, "#p": pubkeys, limit: 1},
  ]

  // Replies
  if (eventIds.length > 0) {
    filters.push({kinds: noteKinds, "#e": eventIds, limit: 1})
  }

  // Only grab one event from each category/relay so we have enough to show
  // the notification badges, but load the details lazily
  subscribePersistent({
    relays,
    filters,
    onEvent: onNotificationEvent,
  })
}
