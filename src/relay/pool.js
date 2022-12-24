import {uniqBy, find, propEq, prop, uniq} from 'ramda'
import {get} from 'svelte/store'
import {relayPool, getPublicKey} from 'nostr-tools'
import {noop, range, sleep} from 'hurdak/lib/hurdak'
import {getTagValues, filterTags} from "src/util/nostr"
import {db} from 'src/relay/db'

// ============================================================================
// Utils/config

const pool = relayPool()

class Channel {
  constructor(name) {
    this.name = name
    this.status = 'idle'
  }
  claim() {
    this.status = 'busy'
  }
  release() {
    this.status = 'idle'
  }
  sub(filter, onEvent, onEose = noop, opts = {}) {
    const relays = Object.keys(pool.relays)

    // If we don't have any relays, we'll wait forever for an eose, but
    // we already know we're done. Use a timeout since callers are
    // expecting this to be async and we run into errors otherwise.
    if (relays.length === 0) {
      setTimeout(onEose)

      return {unsub: noop}
    }

    // Start our subscription, wait for only our fastest relays to eose before calling it done.
    // We were waiting for all before, but that made the slowest relay a bottleneck. Waiting for
    // only one meant we might be settling for very incomplete data
    const eoseRelays = []
    const sub = pool.sub({filter, cb: onEvent}, this.name, r => {
      eoseRelays.push(r)

      // If we have only a few, wait for all of them, otherwise ignore the slowest 1/5
      const threshold = Math.round(relays.length / 10)
      if (eoseRelays.length >= relays.length - threshold) {
        onEose()
      }
    })

    const done = () => {
      if (this.status === 'busy') {
        sub.unsub()
      }

      this.release()
    }

    // If the relay takes to long, just give up
    if (opts.timeout) {
      setTimeout(done, opts.timeout)
    }

    return {unsub: done}
  }
  all(filter, opts = {}) {
    /* eslint no-async-promise-executor: 0 */
    return new Promise(async resolve => {
      const result = []

      const sub = this.sub(
        filter,
        e => result.push(e),
        r => {
          sub.unsub()

          resolve(uniqBy(prop('id'), result))
        },
        {timeout: 30000, ...opts},
      )
    })
  }
}

export const channels = range(0, 10).map(i => new Channel(i.toString()))

const getChannel = async () => {
  /*eslint no-constant-condition: 0*/

  // Find a channel that isn't busy, or wait for one to become available
  while (true) {
    const channel = find(propEq('status', 'idle'), channels)

    if (channel) {
      channel.claim()

      return channel
    }

    await sleep(300)
  }
}

const req = async (...args) => (await getChannel()).all(...args)
const sub = async (...args) => (await getChannel()).sub(...args)

const getPubkey = () => {
  return pool._pubkey || getPublicKey(pool._privkey)
}

const getRelays = () => {
  return Object.keys(pool.relays)
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
  pool.registerSigningFunction(async event => {
    const {sig} = await window.nostr.signEvent(event)

    return sig
  })

  pool._pubkey = pubkey
}

const publishEvent = event => {
  pool.publish(event)
  db.events.process(event)
}

const loadEvents = async filter => {
  const events = await req(filter)

  await db.events.process(events)

  return events
}

const listenForEvents = async (key, filter, onEvent) => {
  if (listenForEvents.subs[key]) {
    listenForEvents.subs[key].unsub()
  }

  listenForEvents.subs[key] = await sub(filter, e => {
    db.events.process(e)

    if (onEvent) {
      onEvent(e)
    }
  })
}

listenForEvents.subs = {}

const loadPeople = (pubkeys, opts = {}) => {
  if (pubkeys.length === 0) {
    return []
  }

  return loadEvents({kinds: [0, 3, 12165], authors: pubkeys}, opts)
}

const syncNetwork = async () => {
  const $user = get(db.user)

  let pubkeys = []
  if ($user) {
    // Get this user's profile to start with
    await loadPeople([$user.pubkey], {timeout: null})

    // Get our refreshed person
    const people = get(db.people)

    // Merge the new info into our user
    Object.assign($user, people[$user.pubkey])

    // Update our user store
    db.user.update(() => $user)

    // Get n degreees of separation using petnames
    pubkeys = uniq(getTagValues($user.petnames))
  }

  // Fall back to some pubkeys we like so we can support new users
  if (pubkeys.length === 0) {
    pubkeys = [
      "3bf0c63fcb93463407af97a5e5ee64fa883d107ef9e558472c4eb9aaaefa459d", // fiatjaf
      "32e1827635450ebb3c5a7d12c1f8e7b2b514439ac10a67eef3d9fd9c5c68e245", // jb55
      "97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322", // hodlbod
      "472f440f29ef996e92a186b8d320ff180c855903882e59d50de1b8bd5669301e", // Marty Bent
      "82341f882b6eabcd2ba7f1ef90aad961cf074af15b9ef44a09f9d2a8fbfbe6a2", // Jack
      "85080d3bad70ccdcd7f74c29a44f55bb85cbcd3dd0cbb957da1d215bdb931204", // Preston
      "c4eabae1be3cf657bc1855ee05e69de9f059cb7a059227168b80b89761cbc4e0", // Jack Mallers
    ]
  }

  let authors = pubkeys
  for (let depth = 0; depth < 1; depth++) {
    const events = await loadPeople(pubkeys)

    pubkeys = filterTags({type: "p"}, events.filter(e => e.kind === 3))
    authors = uniq(authors.concat(pubkeys))
  }

  // Save this for next time
  db.network.set(authors)
}

export default {
  getPubkey, getRelays, addRelay, removeRelay, setPrivateKey, setPublicKey,
  publishEvent, loadEvents, listenForEvents, syncNetwork, loadPeople,
}
