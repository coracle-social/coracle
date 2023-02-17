import {pluck, find, reject} from 'ramda'
import {derived} from 'svelte/store'
import {synced, now, timedelta} from 'src/util/misc'
import user from 'src/agent/user'
import {getUserReadRelays} from 'src/agent/relays'
import database from 'src/agent/database'
import network from 'src/agent/network'

let listener

const since = now() - timedelta(30, 'days')
const mostRecentByPubkey = synced('app/messages/mostRecentByPubkey', {})
const lastCheckedByPubkey = synced('app/messages/lastCheckedByPubkey', {})

const hasNewMessages = derived(
  [lastCheckedByPubkey, mostRecentByPubkey],
  ([$lastCheckedByPubkey, $mostRecentByPubkey]) => {
    return Boolean(find(
      ([k, t]) => {
        return t > now() - timedelta(7, 'days') && ($lastCheckedByPubkey[k] || 0) < t
      },
      Object.entries($mostRecentByPubkey)
    ))
  }
)

const listen = async pubkey => {
  if (listener) {
    listener.unsub()
  }

  listener = await network.listen(
    getUserReadRelays(),
    [{kinds: [4], authors: [pubkey], since},
     {kinds: [4], '#p': [pubkey], since}],
    async events => {
      // Reload annotated messages, don't alert about messages to self
      const messages = reject(e => e.pubkey === e.recipient, await database.messages.all())

      if (messages.length > 0) {
        await network.loadPeople(pluck('pubkey', messages))

        mostRecentByPubkey.update(o => {
          for (const {pubkey, created_at} of messages) {
            if (pubkey !== user.getPubkey()) {
              o[pubkey] = Math.max(created_at, o[pubkey] || 0)
            }
          }

          return o
        })
      }
    }
  )
}

export default {listen, mostRecentByPubkey, lastCheckedByPubkey, hasNewMessages}
