import {relayInit} from 'nostr-tools'
import {uniqBy, reject, prop, find, whereEq, is, filter, identity} from 'ramda'
import {ensurePlural} from 'hurdak/lib/hurdak'
import {isRelay} from 'src/util/nostr'
import {sleep} from 'src/util/misc'
import {db} from 'src/agent/data'

let connections = []

class Connection {
  constructor(url) {
    this.promise = null
    this.nostr = this.init(url)
    this.status = 'new'
    this.url = url
    this.stats = {
      count: 0,
      timer: 0,
      timeouts: 0,
      activeCount: 0,
    }

    connections.push(this)
  }
  init(url) {
    const nostr = relayInit(url)

    nostr.on('disconnect', () => {
      connections = reject(whereEq({url}), connections)
    })

    return nostr
  }
  async connect() {
    const shouldConnect = (
      this.status === 'new'
      || (
        this.status === 'error'
        && Date.now() - this.lastRequest > 30_000
      )
    )

    if (shouldConnect) {
      this.status = 'pending'
      this.promise = this.nostr.connect()
    }

    if (this.status === 'pending') {
      try {
        await this.promise
        this.status = 'ready'
      } catch (e) {
        this.status = 'error'
      }
    }

    this.lastRequest = Date.now()

    return this
  }
  async disconnect() {
    this.status = 'closed'
    await this.nostr.close()
  }
}

const getConnections = () => connections

const findConnection = url => find(whereEq({url}), connections)

const connect = async url => {
  const conn = findConnection(url) || new Connection(url)

  await db.relays.put({url})
  await Promise.race([conn.connect(), sleep(5000)])

  if (conn.status === 'ready') {
    return conn
  }
}

const publish = async (relays, event) => {
  return Promise.all(
    relays.filter(r => r.write !== '!' && isRelay(r.url)).map(async relay => {
      const conn = await connect(relay.url)

      if (conn) {
        return conn.nostr.publish(event)
      }
    })
  )
}

const describeFilter = ({kinds = [], ...filter}) => {
  let parts = []

  parts.push(kinds.join(','))

  for (const [key, value] of Object.entries(filter)) {
    if (is(Array, value)) {
      parts.push(`${key}[${value.length}]`)
    } else {
      parts.push(key)
    }
  }

  return '(' + parts.join(',') + ')'
}

const subscribe = async (relays, filters) => {
  relays = uniqBy(prop('url'), relays.filter(r => isRelay(r.url)))
  filters = ensurePlural(filters)

  // Create a human readable subscription id for debugging
  const id = [
    Math.random().toString().slice(2, 6),
    filters.map(describeFilter).join(':'),
  ].join('-')

  const seen = new Set()
  const eose = []
  const events = []
  let onEvent
  let onEose

  const subs = filter(identity, await Promise.all(
    relays.map(async relay => {
      const conn = await connect(relay.url)

      // If the relay failed to connect, give up
      if (!conn) {
        return null
      }

      const sub = conn.nostr.sub(filters, {id})

      // Subscribe to events immediately so we don't miss any while we
      // wait for slow relays to connect
      sub.on('event', e => {
        if (!seen.has(e.id)) {
          e.seen_on = sub.conn.url
          seen.add(e.id)

          if (onEvent) {
            onEvent(e)
          } else {
            events.push(e)
          }
        }
      })

      // Same thing for eose
      sub.on('eose', () => {
        if (onEose) {
          onEose(conn.url)
        } else {
          eose.push(conn.url)
        }
      })

      sub.conn = conn
      sub.conn.stats.activeCount += 1

      if (sub.conn.stats.activeCount > 10) {
        console.warn(`Relay ${sub.conn.url} has >10 active subscriptions`)
      }

      return sub
    })
  ))


  return {
    subs,
    unsub: () => {
      subs.forEach(sub => {
        if (sub.conn.status === 'ready') {
          sub.unsub()
        }

        sub.conn.stats.activeCount -= 1
      })
    },
    onEvent: cb => {
      // Report our buffered events
      events.splice(0).forEach(e => cb(e))

      // Add our listener for future ones
      onEvent = cb
    },
    onEose: cb => {
      // Report our buffered eoses
      eose.splice(0).forEach(e => cb(e))

      // Add our listener for future ones
      onEose = cb
    },
  }
}

const request = (relays, filters, {threshold = 1} = {}) => {
  relays = uniqBy(prop('url'), relays.filter(r => isRelay(r.url)))

  return new Promise(async resolve => {
    const agg = await subscribe(relays, filters)
    const now = Date.now()
    const relaysWithEvents = new Set()
    const events = []
    const eose = []

    const attemptToComplete = () => {
      // If we have all relays, more than `threshold` reporting events, most after
      // a short timeout, or all after a long timeout, go ahead and unsubscribe.
      const done = (
        eose.length === agg.subs.length
        || eose.filter(url => relaysWithEvents.has(url)).length >= threshold
        || (
          Date.now() - now >= 1000
          && eose.length > agg.subs.length - Math.round(agg.subs.length / 10)
        )
        || Date.now() - now >= 5000
      )

      if (done) {
        agg.unsub()
        resolve(events)

        // Keep track of relay timeouts
        agg.subs.forEach(async sub => {
          if (!eose.includes(sub.conn.url)) {
            const conn = findConnection(sub.conn.url)

            if (conn) {
              conn.stats.count += 1
              conn.stats.timer += Date.now() - now
              conn.stats.timeouts += 1
            }
          }
        })
      }
    }

    agg.onEvent(e => {
      relaysWithEvents.add(e.seen_on)
      events.push(e)
    })

    agg.onEose(async url => {
      if (!eose.includes(url)) {
        eose.push(url)

        const conn = findConnection(url)

        // Keep track of relay timing stats
        if (conn) {
          conn.stats.count += 1
          conn.stats.timer += Date.now() - now
        }
      }

      attemptToComplete()
    })

    // If a relay takes too long, give up
    setTimeout(attemptToComplete, 5000)
  })
}

export default {getConnections, findConnection, connect, publish, subscribe, request}
