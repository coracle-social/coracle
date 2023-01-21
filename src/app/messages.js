import {pluck} from 'ramda'
import {synced, now, timedelta, batch} from 'src/util/misc'
import {listen as _listen} from 'src/agent'
import loaders from 'src/app/loaders'

let listener

const since = now() - timedelta(30, 'days')
const mostRecentByPubkey = synced('app/messages/mostRecentByPubkey', {})
const lastCheckedByPubkey = synced('app/messages/lastCheckedByPubkey', {})

const listen = async (relays, pubkey) => {
  if (listener) {
    listener.unsub()
  }

  listener = await _listen(
    relays,
    [{kinds: [4], authors: [pubkey], since},
     {kinds: [4], '#p': [pubkey], since}],
    batch(300, async events => {
      if (events.length > 0) {
        await loaders.loadPeople(relays, pluck('pubkey', events))

        mostRecentByPubkey.update(o => {
          for (const {pubkey, created_at} of events) {
            o[pubkey] = Math.max(created_at, o[pubkey] || 0)
          }

          return o
        })
      }
    })
  )
}

export default {listen, mostRecentByPubkey, lastCheckedByPubkey}
