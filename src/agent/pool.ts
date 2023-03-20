import type {Relay, Filter} from "nostr-tools"
import type {Deferred} from "src/util/misc"
import type {MyEvent} from "src/util/types"
import {verifySignature} from "nostr-tools"
import {pluck, objOf, identity, is} from "ramda"
import {ensurePlural, noop} from "hurdak/lib/hurdak"
import {warn, log, error} from "src/util/logger"
import {union, defer, tryJson, now, difference} from "src/util/misc"
import {isRelay, normalizeRelayUrl} from "src/util/nostr"

const forceRelays = (import.meta.env.VITE_FORCE_RELAYS || "")
  .split(",")
  .filter(identity)
  .map(objOf("url"))

// Connection management

const connections = {}

const CONNECTION_STATUS = {
  NEW: "new",
  ERROR: "error",
  PENDING: "pending",
  CLOSED: "closed",
  READY: "ready",
}

class Connection {
  ws?: WebSocket
  url: string
  promise?: Deferred<void>
  queue: string[]
  status: string
  closed?: number
  timeout?: number
  listeners: Record<string, Record<string, (...args: any[]) => void>>
  stats: Record<string, number>
  constructor(url) {
    this.ws = null
    this.url = url
    this.promise = null
    this.queue = []
    this.status = CONNECTION_STATUS.NEW
    this.closed = null
    this.timeout = null

    this.listeners = {
      OK: {},
      ERROR: {},
      EVENT: {},
      EOSE: {},
    }

    this.stats = {
      timeouts: 0,
      subsCount: 0,
      eoseCount: 0,
      eoseTimer: 0,
      eventsCount: 0,
      activeSubsCount: 0,
    }

    connections[url] = this
  }
  connect() {
    if (this.ws) {
      throw new Error("Attempted to connect when already connected")
    }

    this.status = CONNECTION_STATUS.PENDING
    this.ws = new WebSocket(this.url)
    this.promise = defer()
    this.closed = null

    this.ws.addEventListener("open", () => {
      this.status = CONNECTION_STATUS.READY
      this.promise.resolve()
    })

    this.ws.addEventListener("message", e => {
      this.queue.push(e.data)

      if (!this.timeout) {
        this.timeout = window.setTimeout(() => this.handleMessages(), 10)
      }
    })

    this.ws.addEventListener("error", () => {
      this.status = CONNECTION_STATUS.ERROR
      this.promise.reject()
      this.closed = now()
    })

    this.ws.addEventListener("close", () => {
      this.status = CONNECTION_STATUS.CLOSED
      this.promise.reject()
      this.closed = now()
    })
  }
  disconnect() {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.close()
    }

    this.ws = null
  }
  async autoConnect() {
    if (this.status === CONNECTION_STATUS.NEW) {
      this.connect()
    } else if (this.closed && now() - 10 > this.closed) {
      // If the connection was closed, try to re-open, but throttle it
      this.disconnect()
      this.connect()
    }

    await this.promise.catch(noop)

    return this
  }
  on(name, id, cb) {
    this.listeners[name][id] = cb
  }
  off(name, id) {
    delete this.listeners[name][id]
  }
  handleMessages() {
    for (const json of this.queue.splice(0, 10)) {
      const message = tryJson(() => JSON.parse(json))

      if (message) {
        const [verb, ...payload] = message

        for (const listener of Object.values(this.listeners[verb] || {})) {
          listener(...payload)
        }
      }
    }

    this.timeout = this.queue.length > 0 ? window.setTimeout(() => this.handleMessages(), 10) : null
  }
  send(...payload) {
    this.ws.send(JSON.stringify(payload))
  }
  subscribe(filters, id, {onEvent, onEose}) {
    this.on("EVENT", id, (subid, e) => subid === id && onEvent(e))
    this.on("EOSE", id, subid => subid === id && onEose())

    this.send("REQ", id, ...filters)

    return {
      conn: this,
      unsub: () => {
        this.send("CLOSE", id, ...filters)

        this.off("EVENT", id)
        this.off("EOSE", id)
      },
    }
  }
  publish(event, {onOk, onError}) {
    const withCleanup = f => eid => {
      if (eid === event.id) {
        f()
        this.off("OK", event.id)
        this.off("ERROR", event.id)
      }
    }

    this.on("OK", event.id, withCleanup(onOk))
    this.on("ERROR", event.id, withCleanup(onError))

    this.send("EVENT", event)
  }
  hasRecentError() {
    return this.status === CONNECTION_STATUS.ERROR && now() - this.closed < 10
  }
  getQuality() {
    if (this.status === CONNECTION_STATUS.ERROR) {
      return [0, "Failed to connect"]
    }

    const {timeouts, subsCount, eoseTimer, eoseCount} = this.stats
    const timeoutRate = timeouts > 0 ? timeouts / subsCount : null
    const eoseQuality = eoseCount > 0 ? Math.max(1, 500 / (eoseTimer / eoseCount)) : null

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
    warn(`Invalid relay url ${url}`)
  }

  if (url !== normalizeRelayUrl(url)) {
    warn(`Received non-normalized relay url ${url}`)
  }

  if (!connections[url]) {
    connections[url] = new Connection(url)
  }

  return connections[url].autoConnect()
}

const disconnect = url => {
  if (connections[url]) {
    connections[url].disconnect()

    delete connections[url]
  }
}

// Public api - publish/subscribe

const publish = async ({relays, event, onProgress, timeout = 5000}) => {
  if (forceRelays.length > 0) {
    relays = forceRelays
  }

  if (relays.length === 0) {
    error(`Attempted to publish to zero relays`, event)
  } else {
    log(`Publishing to ${relays.length} relays`, event, relays)
  }

  const urls = new Set(pluck("url", relays))

  if (urls.size !== relays.length) {
    warn(`Attempted to publish to non-unique relays`)
  }

  return new Promise(resolve => {
    let resolved = false
    const timeouts = new Set()
    const succeeded = new Set()
    const failed = new Set()

    const getProgress = () => {
      const completed = union(timeouts, succeeded, failed)
      const pending = difference(urls, completed)

      return {succeeded, failed, timeouts, completed, pending}
    }

    const attemptToResolve = () => {
      // Don't report progress once we're done, even if more errors/ok come through
      if (resolved) {
        return
      }

      const progress = getProgress()

      if (onProgress) {
        onProgress(progress)
      }

      if (progress.pending.size === 0) {
        log(`Finished publishing to ${urls.size} relays`, event, progress)
        resolve(progress)
        resolved = true
      }
    }

    setTimeout(() => {
      for (const {url} of relays) {
        if (!succeeded.has(url) && !failed.has(url)) {
          timeouts.add(url)
        }
      }

      attemptToResolve()
    }, timeout)

    relays.map(async relay => {
      const conn = await connect(relay.url)

      if (conn.status === CONNECTION_STATUS.READY) {
        conn.publish(event, {
          onOk: () => {
            succeeded.add(relay.url)
            timeouts.delete(relay.url)
            failed.delete(relay.url)
            attemptToResolve()
          },
          onError: () => {
            failed.add(relay.url)
            timeouts.delete(relay.url)
            attemptToResolve()
          },
        })
      } else {
        failed.add(relay.url)
        attemptToResolve()
      }
    })

    attemptToResolve()
  })
}

type SubscribeOpts = {
  relays: Relay[]
  filter: Filter[] | Filter
  onEvent: (event: MyEvent) => void
  onError?: (url: string) => void
  onEose?: (url: string) => void
}

const subscribe = async ({relays, filter, onEvent, onEose, onError}: SubscribeOpts) => {
  filter = ensurePlural(filter)

  if (forceRelays.length > 0) {
    relays = forceRelays
  }

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

  if (relays.length !== new Set(pluck("url", relays)).size) {
    error(`Subscribed to non-unique relays`, relays)
  }

  const promises = relays.map(async relay => {
    const conn = await connect(relay.url)

    if (conn.status !== "ready") {
      if (onError) {
        onError(relay.url)
      }

      return
    }

    conn.stats.subsCount += 1
    conn.stats.activeSubsCount += 1

    if (conn.stats.activeSubsCount > 10) {
      warn(`Relay ${conn.url} has >10 active subscriptions`)
    }

    return conn.subscribe(filter, id, {
      onEvent: e => {
        if (seen.has(e.id)) {
          return
        }

        seen.add(e.id)

        if (!verifySignature(e)) {
          return
        }

        conn.stats.eventsCount += 1

        onEvent({...e, seen_on: relay.url, content: e.content || ""})
      },
      onEose: () => {
        if (onEose) {
          onEose(conn.url)
        }

        // Keep track of relay timing stats, but only for the first eose we get
        if (!eose.has(conn.url)) {
          eose.add(conn.url)

          conn.stats.eoseCount += 1
          conn.stats.eoseTimer += Date.now() - now
        }
      },
    })
  })

  return {
    isActive: () => active,
    unsub: () => {
      if (!active) {
        return
      }

      active = false

      log(`Closing subscription ${id}`)

      promises.forEach(async promise => {
        const sub = await promise

        if (sub) {
          sub.unsub()
          sub.conn.stats.activeSubsCount -= 1
        }
      })
    },
  }
}

// Utils

const createFilterId = filters =>
  [Math.random().toString().slice(2, 6), filters.map(describeFilter).join(":")].join("-")

const describeFilter = ({kinds = [], ...filter}) => {
  const parts = []

  parts.push(kinds.join(","))

  for (const [key, value] of Object.entries(filter)) {
    if (is(Array, value)) {
      parts.push(`${key}[${value.length}]`)
    } else {
      parts.push(key)
    }
  }

  return "(" + parts.join(",") + ")"
}

export default {
  forceRelays,
  getConnections,
  getConnection,
  connect,
  disconnect,
  publish,
  subscribe,
}
