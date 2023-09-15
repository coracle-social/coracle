import {pluck, slice, filter, without, sortBy} from "ramda"
import {seconds, batch, doPipe} from "hurdak"
import {now} from "src/util/misc"
import type {Event} from "src/engine2/model"
import {EventKind} from "src/engine2/model"
import {noteKinds, reactionKinds} from "src/util/nostr"
import {env, sessions, events, notificationsLastChecked} from "src/engine2/state"
import {mergeHints, getPubkeyHints, nip28ChannelsForUser} from "src/engine2/queries"
import {subscribe, subscribePersistent} from "./subscription"
import {ContextLoader} from "./context"

export const loadNotifications = () => {
  const pubkeys = Object.keys(sessions.get())
  const cutoff = now() - seconds(30, "day")
  const since = Math.max(cutoff, notificationsLastChecked.get() - seconds(1, "day"))

  const kinds = without(env.get().ENABLE_ZAPS ? [] : [EventKind.Zap], [
    ...noteKinds,
    ...reactionKinds,
  ])

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
  ]

  const context = new ContextLoader({
    filters,
    onEvent: e => {
      events.key(e.id).set(e)
    },
  })

  return subscribe({
    filters,
    timeout: 15000,
    shouldProject: false,
    relays: mergeHints(pubkeys.map(pk => getPubkeyHints(pk, "read"))),
    onEvent: batch(500, (chunk: Event[]) => {
      context.addContext(chunk, {shouldLoadParents: true})

      // Save to our event database
      for (const e of chunk) {
        events.key(e.id).set(e)
      }
    }),
  })
}

export const listenForNotifications = async () => {
  const pubkeys = Object.keys(sessions.get())
  const channelIds = pluck("id", nip28ChannelsForUser.get())

  const eventIds: string[] = doPipe(events.get(), [
    filter((e: Event) => noteKinds.includes(e.kind)),
    sortBy((e: Event) => -e.created_at),
    slice(0, 256),
    pluck("id"),
  ])

  // Only grab one event from each category/relay so we have enough to show
  // the notification badges, but load the details lazily
  subscribePersistent({
    relays: mergeHints(pubkeys.map(pk => getPubkeyHints(pk, "read"))),
    filters: [
      // Messages
      {kinds: [4], "#p": pubkeys, limit: 1},
      {kinds: [1059], "#p": pubkeys, limit: 1},
      // Chat
      {kinds: [42], "#e": channelIds, limit: 1},
      // Mentions/replies
      {kinds: noteKinds, "#p": pubkeys, limit: 1},
      {kinds: noteKinds, "#e": eventIds, limit: 1},
    ],
  })
}
