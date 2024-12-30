import {partition, assoc, now, ago, MONTH} from "@welshman/lib"
import {MESSAGE, DELETE, THREAD, COMMENT} from "@welshman/util"
import type {Subscription} from "@welshman/net"
import type {AppSyncOpts} from "@welshman/app"
import {subscribe, repository, pull, hasNegentropy} from "@welshman/app"
import {userRoomsByUrl, getEventsForUrl} from "@app/state"

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
  const subs: Subscription[] = []

  for (const [url, rooms] of userRoomsByUrl.get()) {
    pullConservatively({
      relays: [url],
      filters: [
        {kinds: [THREAD, DELETE], since: ago(MONTH)},
        {kinds: [COMMENT], "#K": [String(THREAD)], since: ago(MONTH)},
        ...Array.from(rooms).map(room => ({kinds: [MESSAGE], "#h": [room], since: ago(MONTH)})),
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
