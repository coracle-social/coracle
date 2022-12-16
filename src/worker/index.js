import {relayPool} from 'nostr-tools'
import {defmulti, noop, uuid} from 'hurdak/lib/hurdak'
import {now, timedelta} from "src/util/misc"

// ============================================================================
// Utils/config

const pool = relayPool()

const post = (topic, payload) => postMessage({topic, payload})

const req = ({filter, onEvent, onEose = noop})  => {
  // If we don't have any relays, we'll wait forever for an eose, but
  // we already know we're done. Use a timeout since callers are
  // expecting this to be async and we run into errors otherwise.
  if (pool.relays.length === 0) {
    onEose()

    return {unsub: noop}
  }

  const eoseRelays = []
  return pool.sub({filter, cb: onEvent}, uuid(), r => {
    eoseRelays.push(r)

    if (eoseRelays.length === pool.relays.length) {
      onEose()
    }
  })
}

// ============================================================================
// Start up a subscription to get recent data and listen for new stuff

const lastSync = now() - timedelta(1, 'days')

req({
  filter: {
    kinds: [1],
    since: lastSync,
    limit: 10,
  },
  onEvent: e => {
    post('events/put', e)
  },
})

// ============================================================================
// Listen to messages posted from the main application

const withPayload = f => e => f(e.data.payload)

onmessage = defmulti('self', e => e.data.topic)

onmessage.addMethod('pool/addRelay', withPayload(url => {
  pool.addRelay(url)
}))

onmessage.addMethod('pool/removeRelay', withPayload(url => {
  pool.removeRelay(url)
}))

onmessage.addMethod('pool/setPrivateKey', withPayload(privkey => {
  pool.setPrivateKey(privkey)
  pool._privkey = privkey
}))

onmessage.addMethod('pool/setPublicKey', withPayload(pubkey => {
  pool._privkey = pubkey
}))

onmessage.addMethod('event/publish', withPayload(event => {
  pool.publish(event)
}))

onmessage.addMethod('user/update', withPayload(async user => {
  if (!user.pubkey) throw new Error("Invalid user")

  req({
    filter: {kinds: [0], authors: [user.pubkey], since: user.updated_at},
    onEvent: e => {
      try {
        Object.assign(user, JSON.parse(e.content))
      } catch (e) {
        // pass
      }
    },
    onEose: () => {
      post('users/put', {...user, updated_at: now()})
    },
  })
}))
