import type {Relay} from 'nostr-tools'
import type {MyEvent} from 'src/util/types'
import {relayInit} from 'nostr-tools'
import {uniqBy, without, prop, find, is} from 'ramda'
import {ensurePlural} from 'hurdak/lib/hurdak'
import {warn, log, error} from 'src/util/logger'
import {isRelay} from 'src/util/nostr'
import {sleep} from 'src/util/misc'
import database from 'src/agent/database'

const connections = []

const CONNECTION_STATUS = {
  NEW: 'new',
  ERROR: 'error',
  PENDING: 'pending',
  CLOSED: 'closed',
  READY: 'ready',
}

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
      timeouts: 0,
      subCount: 0,
      eoseCount: 0,
      eoseTimer: 0,
      eventsCount: 0,
      activeSubsCount: 0,
    }

    connections.push(this)
  }
  async connect() {
    const shouldConnect = (
      this.status === CONNECTION_STATUS.NEW
      || (
        this.status === CONNECTION_STATUS.ERROR
        && Date.now() - this.lastConnectionAttempt > 60_000
      )
    )

    if (shouldConnect) {
      this.status = CONNECTION_STATUS.PENDING
      this.promise = this.nostr.connect()

      this.nostr.on('connect', () => {
        this.status = CONNECTION_STATUS.READY
      })

      this.nostr.on('error', () => {
        this.status = CONNECTION_STATUS.ERROR
      })
    }

    if (this.status === CONNECTION_STATUS.PENDING) {
      try {
        await this.promise
        this.status = CONNECTION_STATUS.READY
      } catch (e) {
        this.status = CONNECTION_STATUS.ERROR
      }
    }

    this.lastConnectionAttempt = Date.now()

    return this
  }
  async disconnect() {
    this.status = CONNECTION_STATUS.CLOSED

    try {
      await this.nostr.close()
    } catch (e) {
      // For some reason bugsnag is saying this.nostr is undefined, even if we check it
    }
  }
  getQuality() {
    if (this.status === CONNECTION_STATUS.ERROR) {
      return [0, "Failed to connect"]
    }

    const {timeouts, subCount, eoseTimer, eoseCount} = this.stats
    const timeoutRate = subCount > 10 ? timeouts / subCount : null
    const eoseQuality = eoseCount > 10 ? Math.max(1, 500 / (eoseTimer / eoseCount)) : null

    if (timeoutRate && timeoutRate > 0.5) {
      return [1 - timeoutRate, "Slow connection"]
    }

    if (eoseQuality && eoseQuality < 0.7) {
      return [eoseQuality, "Slow connection"]
    }

    if (eoseQuality) {
      return [eoseQuality, "Connected"]
    }

    if ([CONNECTION_STATUS.NEW, CONNECTION_STATUS.PENDING].includes(this.status)) {
      return [0.5, "Trying to connect"]
    }

    if (this.status === CONNECTION_STATUS.CLOSED) {
      return [0.5, "Disconnected"]
    }

    if (this.status === CONNECTION_STATUS.READY) {
      return [1, "Connected"]
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

const normalizeRelays = relays => uniqBy(prop('url'), relays.filter(r => isRelay(r.url)))

const subscribe = async (relays, filters, {onEvent, onEose}: Record<string, (e: any) => void>) => {
  relays = normalizeRelays(relays)
  filters = ensurePlural(filters)

  // Create a human readable subscription id for debugging
  const id = [
    Math.random().toString().slice(2, 6),
    filters.map(describeFilter).join(':'),
  ].join('-')

  // Deduplicate events, track eose stats
  const now = Date.now()
  const seen = new Set()
  const eose = new Set()

  if (relays.length === 0) {
    error(`Attempted to start subscription ${id} with zero relays`, filters)
  } else {
    log(`Starting subscription ${id} with ${relays.length} relays`, filters)
  }

  // Don't await before returning so we're not blocking on slow connects
  const promises = relays.map(async relay => {
    const conn = await connect(relay.url)

    // If the relay failed to connect, give up
    if (!conn || conn.status === 'closed') {
      return null
    }

    const sub = conn.nostr.sub(filters, {id})

    if (onEvent) {
      sub.on('event', e => {
        if (!seen.has(e.id)) {
          seen.add(e.id)

          conn.stats.eventsCount += 1
          e.seen_on = conn.nostr.url

          onEvent(e as MyEvent)
        }
      })
    }

    if (onEose) {
      sub.on('eose', () => {
        onEose(conn.nostr.url)

        // Keep track of relay timing stats, but only for the first eose we get
        if (!eose.has(conn.nostr.url)) {
          eose.add(conn.nostr.url)

          conn.stats.eoseCount += 1
          conn.stats.eoseTimer += Date.now() - now
        }
      })
    }

    conn.stats.subsCount += 1
    conn.stats.activeSubsCount += 1

    if (conn.stats.activeSubsCount > 10) {
      warn(`Relay ${conn.nostr.url} has >10 active subscriptions`)
    }

    return Object.assign(sub, {conn})
  })

  let active = true

  return {
    isActive: () => active,
    unsub: () => {
      log(`Closing subscription ${id}`)

      promises.forEach(async promise => {
        const sub = await promise

        if (sub) {
          if (sub.conn.status === 'ready') {
            sub.unsub()
          }

          active = false
          sub.conn.stats.activeSubsCount -= 1
        }
      })
    },
  }
}

const subscribeUntilEose = async (
  relays,
  filters,
  {onEvent, onEose, onClose, timeout = 10_000}: {
    onEvent: (events: Array<MyEvent>) => void,
    onEose?: (url: string) => void,
    onClose?: () => void,
    timeout?: number
  }
) => {
  relays = normalizeRelays(relays)

  const now = Date.now()
  const eose = new Set()

  const attemptToComplete = () => {
    // If we've already unsubscribed we're good
    if (!agg.isActive()) {
      return
    }

    const isComplete = eose.size === relays.length
    const isTimeout = Date.now() - now >= timeout

    if (isTimeout) {
      const timedOutRelays = without(Array.from(eose), relays)

      log(`Timing out ${timedOutRelays.length} relays after ${timeout}ms`, timedOutRelays)

      timedOutRelays.forEach(url => {
        const conn = findConnection(url)

        if (conn) {
          conn.stats.timeouts += 1
        }
      })
    }

    if (isComplete || isTimeout) {
      onClose?.()
      agg.unsub()
    }
  }

  // If a relay takes too long, give up
  setTimeout(attemptToComplete, timeout)

  const agg = await subscribe(relays, filters, {
    onEvent,
    onEose: url => {
      onEose?.(url)
      attemptToComplete()
    },
  })

  return agg
}

const request = (relays, filters, {threshold = 0.5} = {}): Promise<Record<string, unknown>[]> => {
  return new Promise(async resolve => {
    relays = normalizeRelays(relays)
    threshold = relays.length * threshold

    const now = Date.now()
    const relaysWithEvents = new Set()
    const events = []
    const eose = new Set()

    const attemptToComplete = () => {
      const allEose = eose.size === relays.length
      const atThreshold = Array.from(eose)
        .filter(url => relaysWithEvents.has(url)).length >= threshold

      const hardTimeout = Date.now() - now >= 5000
      const softTimeout = (
        Date.now() - now >= 1000
        && eose.size > relays.length - Math.round(relays.length / 10)
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
        eose.add(url)
        attemptToComplete()
      },
    })
  })
}

export default {
  getConnections, findConnection, connect, publish, subscribe, subscribeUntilEose, request,
}
