import {sortBy, pluck} from 'ramda'
import {first} from 'hurdak/lib/hurdak'
import {synced, batch, now, timedelta} from 'src/util/misc'
import {isAlert} from 'src/util/nostr'
import {listen as _listen, getMuffle, db} from 'src/agent'
import loaders from 'src/app/loaders'
import query from 'src/app/query'

let listener

const start = now() - timedelta(30, 'days')
const since = synced("app/alerts/since", start)
const latest = synced("app/alerts/latest", start)

const listen = async (relays, pubkey) => {
  if (listener) {
    listener.unsub()
  }

  listener = await _listen(
    relays,
    {kinds: [1, 7], '#p': [pubkey], since: start},
    batch(300, async events => {
      events = events.filter(e => isAlert(e, pubkey))

      if (events.length > 0) {
        const context = await loaders.loadContext(relays, events)
        const notes = query.threadify(events, context, {muffle: getMuffle()})

        await db.alerts.bulkPut(notes)

        latest.update(
          $latest =>
            Math.max(first(sortBy(t => -t, pluck('created_at', events))), $latest)
        )
      }
    })
  )
}

export default {listen, since, latest}
