import {pluck, slice, filter, without, sortBy} from "ramda"
import {seconds, doPipe} from "hurdak"
import {now} from "src/util/misc"
import type {Event} from "src/engine/model"
import {EventKind} from "src/engine/model"
import {noteKinds, reactionKinds} from "src/util/nostr"
import {env, sessions, events, notificationsLastChecked} from "src/engine/state"
import {mergeHints, isEventMuted, getPubkeyHints, nip28ChannelsForUser} from "src/engine/queries"
import {subscribe, subscribePersistent} from "./subscription"

export const getNotificationKinds = () =>
  without(env.get().ENABLE_ZAPS ? [] : [EventKind.Zap], [...noteKinds, ...reactionKinds])

export const loadNotifications = () => {
  const kinds = getNotificationKinds()
  const pubkeys = Object.keys(sessions.get())
  const cutoff = now() - seconds(30, "day")
  const since = Math.max(cutoff, notificationsLastChecked.get() - seconds(1, "day"))

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
    onEvent: (e: Event) => {
      if (!isEventMuted(e).get()) {
        events.key(e.id).set(e)
      }
    },
  })
}

export const listenForNotifications = async () => {
  const kinds = getNotificationKinds()
  const pubkeys = Object.keys(sessions.get())
  const channelIds = pluck("id", nip28ChannelsForUser.get())

  const relays = mergeHints(pubkeys.map(pk => getPubkeyHints(pk, "read")))

  const eventIds: string[] = doPipe(events.get(), [
    filter((e: Event) => noteKinds.includes(e.kind)),
    sortBy((e: Event) => -e.created_at),
    slice(0, 256),
    pluck("id"),
  ])

  const filters = [
    // NIP04 Messages
    {kinds: [4], "#p": pubkeys, limit: 1},
    // NIP24 Messages
    {kinds: [1059], "#p": pubkeys, limit: 1},
    // Mentions
    {kinds: noteKinds, "#p": pubkeys, limit: 1},
  ]

  // Chat
  if (channelIds.length > 0) {
    filters.push({kinds: [42], "#e": channelIds, limit: 1})
  }

  // Replies
  if (eventIds.length > 0) {
    filters.push({kinds: noteKinds, "#e": eventIds, limit: 1})
  }

  // Only grab one event from each category/relay so we have enough to show
  // the notification badges, but load the details lazily
  subscribePersistent({
    relays,
    filters,
    onEvent: (e: Event) => {
      if (kinds.includes(e.kind) && !isEventMuted(e).get()) {
        events.key(e.id).set(e)
      }
    },
  })
}
