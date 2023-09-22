import {pluck, slice, filter, without, sortBy} from "ramda"
import {seconds, doPipe} from "hurdak"
import {now} from "src/util/misc"
import {noteKinds, reactionKinds} from "src/util/nostr"
import type {Event} from "src/engine/events/model"
import type {Filter} from "src/engine/network/model"
import {EventKind} from "src/engine/events/model"
import {env, sessions} from "src/engine/session/state"
import {events} from "src/engine/events/state"
import {isEventMuted} from "src/engine/people/utils"
import {mergeHints, getPubkeyHints} from "src/engine/relays/utils"
import {subscribe, subscribePersistent} from "src/engine/network/utils"
import {mutes} from "src/engine/people/derived"
import {nip28ChannelsForUser} from "src/engine/channels/derived"
import {notificationsLastChecked} from "./state"

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
      if (!isEventMuted(mutes.get(), e)) {
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

  const filters: Filter[] = [
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
      if (kinds.includes(e.kind) && !isEventMuted(mutes.get(), e)) {
        events.key(e.id).set(e)
      }
    },
  })
}
