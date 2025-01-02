import {get} from "svelte/store"
import {partition, assoc, now} from "@welshman/lib"
import {MESSAGE, THREAD, COMMENT} from "@welshman/util"
import type {Subscription} from "@welshman/net"
import type {AppSyncOpts} from "@welshman/app"
import {subscribe, load, repository, pull, hasNegentropy} from "@welshman/app"
import {userRoomsByUrl, getUrlsForEvent} from "@app/state"

// Utils

export const pullConservatively = ({relays, filters}: AppSyncOpts) => {
  const $getUrlsForEvent = get(getUrlsForEvent)
  const [smart, dumb] = partition(hasNegentropy, relays)
  const promises = [pull({relays: smart, filters})]
  const allEvents = repository.query(filters, {shouldSort: false})

  // Since pulling from relays without negentropy is expensive, limit how many
  // duplicates we repeatedly download
  for (const url of dumb) {
    const events = allEvents.filter(e => $getUrlsForEvent(e.id).includes(url))

    if (events.length > 100) {
      filters = filters.map(assoc("since", events[10]!.created_at))
    }

    promises.push(pull({relays: [url], filters}))
  }

  return Promise.all(promises)
}

// Application requests

export const listenForNotifications = () => {
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
          {kinds: [THREAD], since: now()},
          {kinds: [COMMENT], "#K": [String(THREAD)], since: now()},
          {kinds: [MESSAGE], "#h": Array.from(rooms), since: now()},
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
