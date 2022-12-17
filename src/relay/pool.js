import {uniqBy, prop} from 'ramda'
import {relayPool, getPublicKey} from 'nostr-tools'
import {noop, range} from 'hurdak/lib/hurdak'
import {now, randomChoice, timedelta, getLocalJson, setLocalJson} from "src/util/misc"
import {getTagValues} from "src/util/nostr"
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

export const channels = range(0, 10).map(i => new Channel(i.toString()))

const req = filter => randomChoice(channels).all(filter)

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
  db.events.process(event)
}

const loadEvents = async filter => {
  const events = await req(filter)

  await db.events.process(events)

  return events
}

const syncPersonInfo = async person => {
  const [events] = await Promise.all([
    // Get profile info events
    req({kinds: [0, 3, 12165], authors: [person.pubkey]}),
    // Make sure we have something in the database
    db.people.put({muffle: [], petnames: [], updated_at: 0, ...person}),
  ])

  // Process the events to flesh out the person
  await db.events.process(events)

  // Return our person for convenience
  return await db.people.where('pubkey').equals(person.pubkey).first()
}

const fetchEvents = async filter => {
  db.events.process(await req(filter))
}

let syncSub = null
let syncChan = new Channel('sync')

const sync = async person => {
  if (syncSub) {
    (await syncSub).unsub()
  }

  if (!person) return

  // Get person info right away
  const {petnames, pubkey} = await syncPersonInfo(person)

  // Don't grab nothing, but don't grab everything either
  const since = Math.max(
    now() - timedelta(3, 'days'),
    Math.min(
      now() - timedelta(3, 'hours'),
      getLocalJson('pool/lastSync') || 0
    )
  )

  setLocalJson('pool/lastSync', now())

  // Populate recent activity in network so the person has something to look at right away
  syncSub = syncChan.sub(
    [{since, authors: getTagValues(petnames).concat(pubkey)},
     {since, '#p': [pubkey]}],
    db.events.process
  )
}

export default {
  getPubkey, addRelay, removeRelay, setPrivateKey, setPublicKey,
  publishEvent, loadEvents, syncPersonInfo, fetchEvents, sync,
}
