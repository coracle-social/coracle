import {partition, assoc, now} from "@welshman/lib"
import {MESSAGE, REACTION, DELETE, THREAD, COMMENT} from "@welshman/util"
import type {Subscription} from "@welshman/net"
import type {AppSyncOpts} from "@welshman/app"
import {subscribe, repository, load, pull, hasNegentropy} from "@welshman/app"
import {userRoomsByUrl, LEGACY_MESSAGE, GENERAL, getEventsForUrl} from "@app/state"

// Utils

export const pullConservatively = ({relays, filters}: AppSyncOpts) => {
  const [smart, dumb] = partition(hasNegentropy, relays)
  const promises = [pull({relays: smart, filters})]

  // Since pulling from relays without negentropy is expensive, limit how many
  // duplicates we repeatedly download
  for (const url of dumb) {
    const events = getEventsForUrl(repository, url, filters)

    if (events.length > 100) {
      filters = filters.map(assoc("since", events[10]!.created_at))
    }

    promises.push(pull({relays: [url], filters}))
  }

  return Promise.all(promises)
}

// Application requests

export const listenForNotifications = () => {
  const since = now()
  const subs: Subscription[] = []

  for (const [url, rooms] of userRoomsByUrl.get()) {
    load({
      relays: [url],
      filters: [
        {kinds: [THREAD], limit: 1},
        {kinds: [COMMENT], "#K": [String(THREAD)], limit: 1},
        ...Array.from(rooms).map(room => ({kinds: [MESSAGE], "#h": [room], limit: 1})),
      ],
    })

    subs.push(
      subscribe({
        relays: [url],
        filters: [
          {kinds: [THREAD], since},
          {kinds: [COMMENT], "#K": [String(THREAD)], since},
          {kinds: [MESSAGE], "#h": Array.from(rooms), since},
        ],
      }),
    )
  }

  return () => {
    for (const sub of subs) {
      sub.close()
    }
  }
}

export const listenForChannelMessages = (url: string, room: string) => {
  const since = now()
  const relays = [url]
  const kinds = [MESSAGE, REACTION, DELETE]
  const legacyRoom = room === GENERAL ? "general" : room

  // Load legacy immediate so our request doesn't get rejected by nip29 relays
  load({relays, filters: [{kinds: [LEGACY_MESSAGE], "#~": [legacyRoom]}], delay: 0})

  // Load historical state with negentropy if available
  pullConservatively({relays, filters: [{kinds, "#h": [room]}]})

  // Listen for new messages
  return subscribe({relays, filters: [{kinds, "#h": [room], since}]})
}
