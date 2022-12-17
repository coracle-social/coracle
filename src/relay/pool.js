import {relayPool, getPublicKey} from 'nostr-tools'
import {noop, switcherFn, uuid} from 'hurdak/lib/hurdak'
import {now, timedelta} from "src/util/misc"
import {filterTags} from "src/util/nostr"
import {db} from 'src/relay/db'

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

const getPubkey = () => {
  return pool._pubkey || getPublicKey(pool._privkey)
}

const addRelay = url => {
  pool.addRelay(url)
}

const removeRelay = url => {
  pool.removeRelay(url)
}

const setPrivateKey = privkey => {
  pool.setPrivateKey(privkey)
  pool._privkey = privkey
}

const setPublicKey = pubkey => {
  // TODO fix this, it ain't gonna work
  pool.registerSigningFunction(async event => {
    const {sig} = await window.nostr.signEvent(event)

    return sig
  })

  pool._pubkey = pubkey
}


const publishEvent = event => {
  pool.publish(event)
  db.events.put(event)
}

const updateUser = async user => {
  if (!user.pubkey) throw new Error("Invalid user")

  user = {muffle: [], petnames: [], ...user}

  const sub = req({
    filter: {
      kinds: [0, 3, 12165],
      authors: [user.pubkey],
      since: user.updated_at,
    },
    onEvent: e => {
      switcherFn(e.kind, {
        0: () => Object.assign(user, JSON.parse(e.content)),
        3: () => Object.assign(user, {petnames: e.tags}),
        12165: () => Object.assign(user, {muffle: e.tags}),
      })
    },
    onEose: () => {
      sub.unsub()

      db.users.put({...user, updated_at: now()})
    },
  })
}

const fetchContext = async event => {
  const sub = req({
    filter: [
      {kinds: [5, 7], '#e': [event.id]},
      {kinds: [5], 'ids': filterTags({tag: "e"}, event)},
    ],
    onEvent: e => post('events/put', e),
    onEose: () => sub.unsub(),
  })
}

export default {
  getPubkey, addRelay, removeRelay, setPrivateKey, setPublicKey,
  publishEvent, updateUser, fetchContext,
}
