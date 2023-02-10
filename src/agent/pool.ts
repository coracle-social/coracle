import type {Relay} from 'nostr-tools'
import {relayInit} from 'nostr-tools'
import {uniqBy, prop, find, is} from 'ramda'
import {ensurePlural} from 'hurdak/lib/hurdak'
import {isRelay} from 'src/util/nostr'
import {sleep} from 'src/util/misc'
import database from 'src/agent/database'

const connections = []

class Connection {
  promise: Promise<void>
  nostr: Relay
  status: string
  stats: Record<string, number>
  lastConnectionAttempt: number
  constructor(url) {
    this.promise = null
    this.nostr = relayInit(url)
    this.status = 'new'
    this.stats = {
      count: 0,
      timer: 0,
      timeouts: 0,
      activeCount: 0,
    }

    connections.push(this)
  }
  async connect() {
    const shouldConnect = (
      this.status === 'new'
      || (
        this.status === 'error'
        && Date.now() - this.lastConnectionAttempt > 60_000
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

    this.lastConnectionAttempt = Date.now()

    return this
  }
  async disconnect() {
    this.status = 'closed'

    try {
      await this.nostr.close()
    } catch (e) {
      // For some reason bugsnag is saying this.nostr is undefined, even if we check it
    }
  }
}

const getConnections = () => connections

const findConnection = url => find(c => c.nostr.url === url, connections)

const connect = async url => {
  const conn = findConnection(url) || new Connection(url)

  await database.relays.patch({url})
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
  const parts = []

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

const subscribe = async (relays, filters, {onEvent, onEose}: Record<string, (e: any) => void>) => {
  relays = uniqBy(prop('url'), relays.filter(r => isRelay(r.url)))
  filters = ensurePlural(filters)

  // Create a human readable subscription id for debugging
  const id = [
    Math.random().toString().slice(2, 6),
    filters.map(describeFilter).join(':'),
  ].join('-')

  // Deduplicate events
  const seen = new Set()

  // Don't await before returning so we're not blocking on slow connects
  const promises = relays.map(async relay => {
    const conn = await connect(relay.url)

    // If the relay failed to connect, give up
    if (!conn) {
      return null
    }

    const sub = conn.nostr.sub(filters, {id})

    if (onEvent) {
      sub.on('event', e => {
        if (!seen.has(e.id)) {
          seen.add(e.id)

          onEvent(Object.assign(e, {seen_on: conn.nostr.url}))
        }
      })
    }

    if (onEose) {
      sub.on('eose', () => onEose(conn.nostr.url))
    }

    conn.stats.activeCount += 1

    if (conn.stats.activeCount > 10) {
      console.warn(`Relay ${conn.nostr.url} has >10 active subscriptions`)
    }

    return Object.assign(sub, {conn})
  })

  return {
    unsub: () => {
      promises.forEach(async promise => {
        const sub = await promise

        if (sub) {
          if (sub.conn.status === 'ready') {
            sub.unsub()
          }

          sub.conn.stats.activeCount -= 1
        }
      })
    },
  }
}

const request = (relays, filters, {threshold = 0.5} = {}): Promise<Record<string, unknown>[]> => {
  return new Promise(async resolve => {
    relays = uniqBy(prop('url'), relays.filter(r => isRelay(r.url)))
    threshold = relays.length * threshold

    const now = Date.now()
    const relaysWithEvents = new Set()
    const events = []
    const eose = []

    const attemptToComplete = () => {
      const allEose = eose.length === relays.length
      const atThreshold = eose.filter(url => relaysWithEvents.has(url)).length >= threshold
      const hardTimeout = Date.now() - now >= 5000
      const softTimeout = (
        Date.now() - now >= 1000
        && eose.length > relays.length - Math.round(relays.length / 10)
      )

      if (allEose || atThreshold || hardTimeout || softTimeout) {
        agg.unsub()
        resolve(events)
      }
    }

    // If a relay takes too long, give up
    setTimeout(attemptToComplete, 5000)

    const agg = await subscribe(relays, filters, {
      onEvent: e => {
        relaysWithEvents.add(e.seen_on)
        events.push(e)
      },
      onEose: async url => {
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
      },
    })
  })
}

export default {getConnections, findConnection, connect, publish, subscribe, request}
