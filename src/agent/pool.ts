import type {Relay, Filter} from "nostr-tools"
import type {MyEvent} from "src/util/types"
import {Socket, Pool, Plex, Relays, Executor} from "paravel"
import {verifySignature} from "nostr-tools"
import {pluck, identity} from "ramda"
import {ensurePlural, switcher} from "hurdak/lib/hurdak"
import {warn, log, error} from "src/util/logger"
import {union, sleep, difference} from "src/util/misc"
import {normalizeRelayUrl} from "src/util/nostr"
import {relays} from "src/agent/db"

const Config = {
  multiplextrUrl: null,
  authHandler: null,
}

type StatsItem = {
  error: string | null
  timeouts: number
  subsCount: number
  eoseCount: number
  eoseTimer: number
  eventsCount: number
  activeSubsCount: number
  lastRequest: number
  openedAt: number
  closedAt: number
}

const Meta = {
  stats: {} as Record<string, StatsItem>,
  errors: {},
  getStats(url) {
    if (!this.stats[url]) {
      this.stats[url] = {
        error: null,
        timeouts: 0,
        subsCount: 0,
        eoseCount: 0,
        eoseTimer: 0,
        eventsCount: 0,
        activeSubsCount: 0,
        lastRequest: 0,
        openedAt: 0,
        closedAt: 0,
      }
    }

    return this.stats[url]
  },
  onPublish(urls) {
    urls.forEach(url => {
      const stats = this.getStats(url)

      stats.lastRequest = Date.now()
    })
  },
  onSubscriptionStart(urls) {
    urls.forEach(url => {
      const stats = this.getStats(url)

      stats.subsCount += 1
      stats.activeSubsCount += 1
      stats.lastRequest = Date.now()

      if (stats.activeSubsCount > 10) {
        warn(`Relay ${url} has >10 active subscriptions`)
      }
    })
  },
  onSubscriptionEnd(urls) {
    urls.forEach(url => {
      const stats = this.getStats(url)

      stats.activeSubsCount -= 1
    })
  },
  onEvent(url) {
    const stats = this.getStats(url)

    stats.eventsCount += 1
  },
  onEose(url, ms) {
    const stats = this.getStats(url)

    stats.eoseCount += 1
    stats.eoseTimer += ms
  },
  onTimeout(url) {
    const stats = this.getStats(url)

    stats.timeouts += 1
  },
}

const forceUrls = (import.meta.env.VITE_FORCE_RELAYS || "").split(",").filter(identity)

const countRelay = forceUrls[0] || "wss://rbr.bio"

const defaultUrls =
  forceUrls.length > 0
    ? forceUrls
    : [
        "wss://purplepag.es",
        "wss://relay.damus.io",
        "wss://relay.nostr.band",
        "wss://nostr-pub.wellorder.net",
      ]

const getUrls = relays => {
  if (relays.length === 0) {
    error(`Attempted to connect to zero urls`)
  }

  const urls = new Set(pluck("url", relays).map(normalizeRelayUrl))

  if (urls.size !== relays.length) {
    warn(`Attempted to connect to non-unique relays`)
  }

  return Array.from(urls)
}

const pool = new Pool()

pool.bus.addListeners({
  open: ({url}) => {
    const stats = Meta.getStats(url)

    stats.openedAt = Date.now()
  },
  close: ({url}) => {
    const stats = Meta.getStats(url)

    stats.closedAt = Date.now()
  },
})

function disconnect(url) {
  pool.remove(url)

  delete Meta.stats[url]
  delete Meta.errors[url]
}

function getQuality(url) {
  if (Meta.errors[url]) {
    return [
      0,
      switcher(Meta.errors[url], {
        disconnected: "Disconnected",
        unauthorized: "Logging in",
        forbidden: "Failed to log in",
      }),
    ]
  }

  const stats = Meta.getStats(url)

  const {timeouts, subsCount, eoseTimer, eoseCount} = stats
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

  if (pool.get(url).status === Socket.STATUS.READY) {
    return [1, "Connected"]
  }

  return [0.5, "Not Connected"]
}

async function getExecutor(urls, {bypassBoot = false} = {}) {
  if (forceUrls.length > 0) {
    urls = forceUrls
  }

  let target

  // Try to use our multiplexer, but if it fails to connect fall back to relays. If
  // we're only connecting to a single relay, just do it directly, unless we already
  // have a connection to the multiplexer open, in which case we're probably doing
  // AUTH with a single relay.
  if (Config.multiplextrUrl && (urls.length > 1 || pool.has(Config.multiplextrUrl))) {
    const socket = pool.get(Config.multiplextrUrl)

    if (!socket.error) {
      target = new Plex(urls, pool.get(Config.multiplextrUrl))
    }
  }

  if (!target) {
    target = new Relays(urls.map(url => pool.get(url)))
  }

  const executor = new Executor(target)

  executor.handleAuth({
    onAuth(url, challenge) {
      Meta.errors[url] = "unauthorized"

      return Config.authHandler(url, challenge)
    },
    onOk(url, id, ok, message) {
      Meta.errors[url] = ok ? null : "forbidden"
    },
  })

  // Eagerly connect and handle AUTH
  await Promise.all(
    ensurePlural(executor.target.sockets).map(async socket => {
      const relay = relays.get(socket.url)
      const waitForBoot = relay?.limitation?.payment_required || relay?.limitation?.auth_required

      if (socket.status === Socket.STATUS.NEW) {
        socket.booted = sleep(2000)

        await socket.connect()
      }

      // Delay REQ/EVENT until AUTH flow happens
      if (!bypassBoot && waitForBoot) {
        await socket.booted
      }
    })
  )

  return executor
}

async function publish({relays, event, onProgress, timeout = 3000, verb = "EVENT"}) {
  const urls = getUrls(relays)
  const executor = await getExecutor(urls, {bypassBoot: verb === "AUTH"})

  Meta.onPublish(urls)

  log(`Publishing to ${urls.length} relays`, event, urls)

  return new Promise(resolve => {
    const timeouts = new Set()
    const succeeded = new Set()
    const failed = new Set()

    const getProgress = () => {
      const completed = union(timeouts, succeeded, failed)
      const pending = difference(urls, completed)

      return {succeeded, failed, timeouts, completed, pending}
    }

    const attemptToResolve = () => {
      const progress = getProgress()

      if (progress.pending.size === 0) {
        log(`Finished publishing to ${urls.length} relays`, event, progress)
        resolve(progress)
        sub.unsubscribe()
        executor.target.cleanup()
      } else if (onProgress) {
        onProgress(progress)
      }
    }

    setTimeout(() => {
      for (const url of urls) {
        if (!succeeded.has(url) && !failed.has(url)) {
          timeouts.add(url)
        }
      }

      attemptToResolve()
    }, timeout)

    const sub = executor.publish(event, {
      verb,
      onOk: url => {
        succeeded.add(url)
        timeouts.delete(url)
        failed.delete(url)
        attemptToResolve()
      },
      onError: url => {
        failed.add(url)
        timeouts.delete(url)
        attemptToResolve()
      },
    })

    // Report progress to start
    attemptToResolve()
  })
}

type SubscribeOpts = {
  relays: Relay[]
  filter: Filter[] | Filter
  onEvent: (event: MyEvent) => void
  onEose?: (url: string) => void
}

async function subscribe({relays, filter, onEvent, onEose}: SubscribeOpts) {
  const urls = getUrls(relays)
  const executor = await getExecutor(urls)
  const filters = ensurePlural(filter)
  const now = Date.now()
  const seen = new Map()
  const eose = new Set()

  log(`Starting subscription with ${relays.length} relays`, filters, relays)

  if (relays.length !== new Set(pluck("url", relays)).size) {
    error(`Subscribed to non-unique relays`, relays)
  }

  Meta.onSubscriptionStart(urls)

  const sub = executor.subscribe(filters, {
    onEvent: (url, event) => {
      const seen_on = seen.get(event.id)

      if (seen_on) {
        if (!seen_on.includes(url)) {
          seen_on.push(url)
        }

        return
      }

      Object.assign(event, {
        seen_on: [url],
        content: event.content || "",
      })

      seen.set(event.id, event.seen_on)

      try {
        if (!verifySignature(event)) {
          return
        }
      } catch (e) {
        console.error(e)

        return
      }

      Meta.onEvent(url)

      onEvent(event)
    },
    onEose: url => {
      onEose?.(url)

      // Keep track of relay timing stats, but only for the first eose we get
      if (!eose.has(url)) {
        Meta.onEose(url, Date.now() - now)
      }

      eose.add(url)
    },
  })

  return {
    unsub: () => {
      log(`Closing subscription`, filters)

      sub.unsubscribe()
      executor.target.cleanup()

      Meta.onSubscriptionEnd(urls)
    },
  }
}

async function count(filter) {
  const filters = ensurePlural(filter)
  const executor = await getExecutor([countRelay])

  return new Promise(resolve => {
    const sub = executor.count(filters, {
      onCount: (url, {count}) => resolve(count),
    })

    setTimeout(() => {
      resolve(0)
      sub.unsubscribe()
      executor.target.cleanup()
    }, 3000)
  })
}

export default {
  Config,
  Meta,
  forceUrls,
  defaultUrls,
  disconnect,
  getQuality,
  publish,
  subscribe,
  count,
}
