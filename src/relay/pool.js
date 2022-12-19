import {uniqBy, prop, uniq} from 'ramda'
import {get} from 'svelte/store'
import {relayPool, getPublicKey} from 'nostr-tools'
import {noop, range} from 'hurdak/lib/hurdak'
import {now, timedelta, randomChoice} from "src/util/misc"
import {getTagValues, filterTags} from "src/util/nostr"
import {db} from 'src/relay/db'

// ============================================================================
// Utils/config

const pool = relayPool()

class Channel {
  constructor(name) {
    this.name = name
    this.p = Promise.resolve()
  }
  async sub(filter, onEvent, onEose = noop) {
    // If we don't have any relays, we'll wait forever for an eose, but
    // we already know we're done. Use a timeout since callers are
    // expecting this to be async and we run into errors otherwise.
    if (Object.keys(pool.relays).length === 0) {
      setTimeout(onEose)

      return {unsub: noop}
    }

    // Grab our spot in the queue, save resolve for later
    let resolve
    let p = this.p
    this.p = new Promise(r => {
      resolve = r
    })

    // Make sure callers have to wait for the previous sub to be done
    // before they can get a new one.
    await p

    // Start our subscription, wait for only one relays to eose before
    // calling it done. We were waiting for all before, but that made
    // the slowest relay a bottleneck
    const sub = pool.sub({filter, cb: onEvent}, this.name, onEose)

    return {
      unsub: () => {
        sub.unsub()

        resolve()
      }
    }
  }
  all(filter) {
    /* eslint no-async-promise-executor: 0 */
    return new Promise(async resolve => {
      const result = []

      const sub = await this.sub(
        filter,
        e => result.push(e),
        r => {
          sub.unsub()

          resolve(uniqBy(prop('id'), result))
        },
      )
    })
  }
}

export const channels = range(0, 10).map(i => new Channel(i.toString()))

const req = (...args) => randomChoice(channels).all(...args)
const sub = (...args) => randomChoice(channels).sub(...args)

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

const subs = {}

const listenForEvents = async (key, filter) => {
  if (subs[key]) {
    subs[key].unsub()
  }

  subs[key] = await sub(filter, db.events.process)
}

const loadPeople = pubkeys => {
  return pubkeys.length ? loadEvents({kinds: [0, 3, 12165], authors: pubkeys}) : []
}

const syncNetwork = async () => {
  const $user = get(db.user)

  let pubkeys = []
  if ($user) {
    // Get this user's profile to start with
    await loadPeople([$user.pubkey])

    // Get our refreshed person
    const people = get(db.people)

    // Merge the new info into our user
    Object.assign($user, people[$user.pubkey])

    console.log($user)

    // Update our user store
    db.user.update(() => $user)

    // Get n degreees of separation using petnames
    pubkeys = uniq(getTagValues($user.petnames))
  }

  // Fall back to some pubkeys we like so we can support new users
  if (pubkeys.length === 0) {
    pubkeys = [
      "97c70a44366a6535c145b333f973ea86dfdc2d7a99da618c40c64705ad98e322", // hodlbod
    ]
  }

  let networkPubkeys = pubkeys
  for (let depth = 0; depth < 1; depth++) {
    const events = await loadPeople(pubkeys)

    pubkeys = uniq(filterTags({type: "p"}, events.filter(e => e.kind === 3)))

    networkPubkeys = networkPubkeys.concat(pubkeys)
  }

  db.network.set(networkPubkeys)
}

const syncNetworkNotes = () => {
  const authors = get(db.network)
  const since = now() - timedelta(30, 'days')

  loadEvents({kinds: [1, 5, 7], authors, since, until: now()})
  listenForEvents('networkNotes', {kinds: [1, 5, 7], authors, since: now()})
}

export default {
  getPubkey, getRelays, addRelay, removeRelay, setPrivateKey, setPublicKey,
  publishEvent, loadEvents, syncNetwork, syncNetworkNotes,
}
