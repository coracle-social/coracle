import {pluck} from 'ramda'
import {synced, batch} from 'src/util/misc'
import {listen as _listen} from 'src/agent'
import loaders from 'src/app/loaders'

let listener

const mostRecentByPubkey = synced('app/messages/mostRecentByPubkey', {})
const lastCheckedByPubkey = synced('app/messages/lastCheckedByPubkey', {})

const listen = async (relays, pubkey) => {
  if (listener) {
    listener.unsub()
  }

  listener = await _listen(
    relays,
    {kinds: [4], '#p': [pubkey]},
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
