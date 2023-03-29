import type {Relay, Filter} from "nostr-tools"
import type {MyEvent} from "src/util/types"
import {Socket, Pool, Plex, Relays, Executor} from "paravel"
import {verifySignature} from "nostr-tools"
import {pluck, identity} from "ramda"
import {ensurePlural, switcher} from "hurdak/lib/hurdak"
import {warn, log, error} from "src/util/logger"
import {union, difference} from "src/util/misc"
import {normalizeRelayUrl} from "src/util/nostr"

const Config = {
  multiplextrUrl: null,
  authHandler: null,
}

const Meta = {
  stats: {},
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

function getExecutor(urls) {
  if (forceUrls.length > 0) {
    urls = forceUrls
  }

  let target

  // Try to use our multiplexer, but if it fails to connect fall back to relays. If
  // we're only connecting to a single relay, just do it directly
  if (Config.multiplextrUrl && urls.length > 1) {
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

  return executor
}

async function publish({relays, event, onProgress, timeout = 3000}) {
  const urls = getUrls(relays)
  const executor = getExecutor(urls)

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
  const executor = getExecutor(urls)
  const filters = ensurePlural(filter)
  const now = Date.now()
  const seen = new Set()
  const eose = new Set()

  log(`Starting subscription with ${relays.length} relays`, filters, relays)

  if (relays.length !== new Set(pluck("url", relays)).size) {
    error(`Subscribed to non-unique relays`, relays)
  }

  Meta.onSubscriptionStart(urls)

  const sub = executor.subscribe(filters, {
    onEvent: (url, e) => {
      if (seen.has(e.id)) {
        return
      }

      seen.add(e.id)

      if (!verifySignature(e)) {
        return
      }

      Meta.onEvent(url)

      onEvent({...e, seen_on: url, content: e.content || ""})
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
  const executor = getExecutor(["wss://rbr.bio"])

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
  disconnect,
  getQuality,
  publish,
  subscribe,
  count,
}
