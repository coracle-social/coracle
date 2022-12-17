import {uniqBy, prop} from 'ramda'
import {relayPool, getPublicKey} from 'nostr-tools'
import {noop, switcherFn, uuid} from 'hurdak/lib/hurdak'
import {now, randomChoice, timedelta} from "src/util/misc"
import {filterTags, findReply, findRoot} from "src/util/nostr"
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

    // Start our subscription, wait for all relays to eose before
    // calling it done
    const eoseRelays = []
    const sub = pool.sub({filter, cb: onEvent}, this.name, r => {
      eoseRelays.push(r)

      if (eoseRelays.length === Object.keys(pool.relays).length) {
        onEose()
      }
    })

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

export const channels = [
  new Channel('a'),
  new Channel('b'),
  new Channel('c'),
]

const req = filter => randomChoice(channels).all(filter)

const prepEvent = e => ({...e, root: findRoot(e), reply: findReply(e)})

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
  db.events.put(prepEvent(event))
}

const loadEvents = async filter => {
  const events = await req(filter)

  db.events.bulkPut(events.map(prepEvent))
}

const getUserInfo = async user => {
  for (const e of await req({kinds: [0, 3, 12165], authors: [user.pubkey]})) {
    switcherFn(e.kind, {
      0: () => Object.assign(user, JSON.parse(e.content)),
      3: () => Object.assign(user, {petnames: e.tags}),
      12165: () => Object.assign(user, {muffle: e.tags}),
    })
  }

  return user
}

const fetchContext = async event => {
  const events = await req([
    {kinds: [5, 7], '#e': [event.id]},
    {kinds: [5], 'ids': filterTags({tag: "e"}, event)},
  ])

  db.events.bulkPut(events.map(prepEvent))
}

export default {
  getPubkey, addRelay, removeRelay, setPrivateKey, setPublicKey,
  publishEvent, loadEvents, getUserInfo, fetchContext,
}
