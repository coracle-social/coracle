import {uniqBy, sortBy, find, propEq, prop, uniq} from 'ramda'
import {get} from 'svelte/store'
import {noop, range, sleep} from 'hurdak/lib/hurdak'
import {getTagValues, filterTags} from "src/util/nostr"
import agent from 'src/agent'
import {db} from 'src/relay/db'

// ============================================================================
// Utils/config

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
  async sub(filter, onEvent, onEose = noop, opts = {}) {
    const relays = getRelays()

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
    const lastEvent = {}
    const eoseRelays = []

    // Create our subscription
    const sub = await agent.pool.sub(relays, filter)

    // Keep track of when we last heard from each relay, and close unresponsive ones
    sub.on('event', (r, e) => {
      lastEvent[r] = new Date().valueOf()
      onEvent(e)
    })

    // If we have lots of relays, ignore the slowest ones
    sub.on('eose', r => {
      eoseRelays.push(r)

      // If we have only a few, wait for all of them, otherwise ignore the slowest 1/5
      const threshold = Math.round(relays.length / 10)
      if (eoseRelays.length >= relays.length - threshold) {
        onEose()
      }
    })

    // Clean everything up when we're done
    const done = () => {
      if (this.status === 'busy') {
        sub.unsub()
        this.release()
      }
    }

    return {unsub: done}
  }
  all(filter, opts = {}) {
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
        {timeout: 3000, ...opts},
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

const getRelays = () => {
  return get(db.connections)
}

const addRelay = url => {
  agent.pool.connect(url)
}

const removeRelay = async url => {
  const relay = await agent.pool.connect(url)

  relay.close()
}

const publishEvent = event => {
  const relays = getRelays()

  event = agent.keys.sign(event)
  agent.publish(relays, event)
  db.events.process(event)
}

const loadEvents = async filter => {
  const events = await req(filter)

  await db.events.process(events)

  return events
}

const listenForEvents = async (key, filter, onEvent, {shouldProcess = true} = {}) => {
  if (listenForEvents.subs[key]) {
    listenForEvents.subs[key].unsub()
  }

  listenForEvents.subs[key] = await sub(filter, e => {
    if (shouldProcess) {
      db.events.process(e)
    }

    if (onEvent) {
      onEvent(e)
    }
  })

  return listenForEvents.subs[key]
}

listenForEvents.subs = {}

const loadPeople = (pubkeys, {kinds = [0, 3, 12165], ...opts} = {}) => {
  if (pubkeys.length === 0) {
    return []
  }

  return loadEvents({kinds, authors: pubkeys}, opts)
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

  // Grab second-order follows. Randomize and limit so we're not blasting relays.
  // This will result in people getting a different list of second-order follows every load
  const events = await loadPeople(pubkeys)
  const secondOrderFollows = filterTags({kind: "p"}, events.filter(e => e.kind === 3))
  const randomSecondOrderFollows = sortBy(() => Math.random(), secondOrderFollows)
  const authors = uniq(pubkeys.concat(randomSecondOrderFollows.slice(0, 50)))

  // Save this for next time
  db.network.set(authors)
}

export default {
  getRelays, addRelay, removeRelay, publishEvent, loadEvents, listenForEvents,
  syncNetwork, loadPeople,
}
