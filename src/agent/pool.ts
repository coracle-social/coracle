import type {Relay, Filter} from 'nostr-tools'
import type {MyEvent} from 'src/util/types'
import {relayInit} from 'nostr-tools'
import {is} from 'ramda'
import {ensurePlural} from 'hurdak/lib/hurdak'
import {warn, log, error} from 'src/util/logger'
import {isRelay, normalizeRelayUrl} from 'src/util/nostr'

// Connection management

const connections = {}

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

    connections[url] = this
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

      this.nostr.on('disconnect', () => {
        this.status = CONNECTION_STATUS.CLOSED
      })
    }

    this.lastConnectionAttempt = Date.now()

    try {
      await this.promise
    } catch (e) {
      // This is already handled in the on error handler above
    }

    return this
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

const getConnection = url => connections[url]

const connect = url => {
  if (!isRelay(url)) {
    throw new Error(`Invalid relay url ${url}`)
  }

  url = normalizeRelayUrl(url)

  if (!connections[url]) {
    connections[url] = new Connection(url)
  }

  return connections[url].connect()
}

// Public api - publish/subscribe

const publish = async (relays, event) => {
  if (relays.length === 0) {
    error(`Attempted to publish to zero relays`, event)
  } else {
    log(`Publishing to ${relays.length} relays`, event, relays)
  }

  return Promise.all(
    relays.map(async relay => {
      const conn = await connect(relay.url)

      if (conn.status === CONNECTION_STATUS.READY) {
        return conn.nostr.publish(event)
      }
    })
  )
}

type SubscribeOpts = {
  relays: Relay[]
  filter: Filter[] | Filter
  onEvent: (event: MyEvent) => void
  onError?: (url: string) => void
  onEose?: (url: string) => void
}

const subscribe = async (
  {relays, filter, onEvent, onEose, onError}: SubscribeOpts
) => {
  filter = ensurePlural(filter)

  const id = createFilterId(filter)
  const now = Date.now()
  const seen = new Set()
  const eose = new Set()

  let active = true

  if (relays.length === 0) {
    error(`Attempted to start subscription ${id} with zero relays`, filter)
  } else {
    log(`Starting subscription ${id} with ${relays.length} relays`, filter, relays)
  }

  const promises = relays.map(async relay => {
    const conn = await connect(relay.url)

    if (conn.status !== 'ready') {
      if (onError) {
        onError(relay.url)
      }

      return
    }

    const sub = conn.nostr.sub(filter, {id})

    sub.on('event', e => {
      conn.stats.eventsCount += 1

      if (!seen.has(e.id)) {
        seen.add(e.id)

        onEvent({...e, seen_on: relay.url})
      }
    })

    sub.on('eose', () => {
      if (onEose) {
        onEose(conn.nostr.url)
      }

      // Keep track of relay timing stats, but only for the first eose we get
      if (!eose.has(conn.nostr.url)) {
        eose.add(conn.nostr.url)

        conn.stats.eoseCount += 1
        conn.stats.eoseTimer += Date.now() - now
      }
    })

    conn.stats.subsCount += 1
    conn.stats.activeSubsCount += 1

    if (conn.stats.activeSubsCount > 10) {
      warn(`Relay ${conn.nostr.url} has >10 active subscriptions`)
    }

    return Object.assign(sub, {conn})
  })

  return {
    isActive: () => active,
    unsub: () => {
      log(`Closing subscription ${id}`)

      promises.forEach(async promise => {
        const sub = await promise

        if (sub) {
          sub.unsub()
          active = false
          sub.conn.stats.activeSubsCount -= 1
        }
      })
    },
  }
}

// Utils

const createFilterId = filters =>
  [Math.random().toString().slice(2, 6), filters.map(describeFilter).join(':')].join('-')

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

export default {
  getConnections, getConnection, connect, publish, subscribe,
}
