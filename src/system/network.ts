import type {Filter} from "nostr-tools"
import type {MyEvent} from "src/util/types"
import {EventEmitter} from "events"
import {verifySignature} from "nostr-tools"
import {Pool, Plex, Relays, Executor, Socket} from "paravel"
import {ensurePlural} from "hurdak/lib/hurdak"
import {union, difference} from "src/util/misc"
import {warn, error, log} from "src/util/logger"
import {normalizeRelayUrl} from "src/util/nostr"
import {FORCE_RELAYS, COUNT_RELAYS} from "src/system/env"

type SubscribeOpts = {
  relays: string[]
  filter: Filter[] | Filter
  onEvent?: (event: MyEvent) => void
  onEose?: (url: string) => void
  shouldProcess?: boolean
}

const getUrls = relays => {
  if (relays.length === 0) {
    error(`Attempted to connect to zero urls`)
  }

  const urls = new Set(relays.map(normalizeRelayUrl))

  if (urls.size !== relays.length) {
    warn(`Attempted to connect to non-unique relays`)
  }

  return Array.from(urls)
}

export default class Network extends EventEmitter {
  authHandler?: (url: string, challenge: string) => void
  sync: {
    processEvents: (events: MyEvent[]) => void
  }
  settings: {
    getSetting: (name: string) => string
  }
  routing: {
    getRelayMeta: (url: string) => {
      limitation?: {
        auth_required?: boolean
        payment_required?: boolean
      }
    }
  }
  pool: Pool
  constructor({sync, settings, routing}) {
    super()

    this.authHandler = null
    this.sync = sync
    this.settings = settings
    this.routing = routing
    this.pool = new Pool()
  }
  getExecutor = (urls, {bypassBoot = false} = {}) => {
    if (FORCE_RELAYS.length > 0) {
      urls = FORCE_RELAYS
    }

    let target

    const muxUrl = this.settings.getSetting("multiplextrUrl")

    // Try to use our multiplexer, but if it fails to connect fall back to relays. If
    // we're only connecting to a single relay, just do it directly, unless we already
    // have a connection to the multiplexer open, in which case we're probably doing
    // AUTH with a single relay.
    if (muxUrl && (urls.length > 1 || this.pool.has(muxUrl))) {
      const socket = this.pool.get(muxUrl)

      if (!socket.error) {
        target = new Plex(urls, socket)
      }
    }

    if (!target) {
      target = new Relays(urls.map(url => this.pool.get(url)))
    }

    const executor = new Executor(target)

    executor.handleAuth({
      onAuth(url, challenge) {
        this.emit("error:set", url, "unauthorized")

        return this.authHandler?.(url, challenge)
      },
      onOk(url, id, ok, message) {
        this.emit("error:clear", url, ok ? null : "forbidden")

        // Once we get a good auth response don't wait to send stuff to the relay
        if (ok) {
          this.pool.get(url)
          this.pool.booted = true
        }
      },
    })

    // Eagerly connect and handle AUTH
    executor.target.sockets.forEach(socket => {
      const {limitation} = this.routing.getRelayMeta(socket.url)
      const waitForBoot = limitation?.payment_required || limitation?.auth_required

      socket.connect()

      // Delay REQ/EVENT until AUTH flow happens. Highly hacky, as this relies on
      // overriding the `shouldDeferWork` property of the socket. We do it this way
      // so that we're not blocking sending to all the other public relays
      if (!bypassBoot && waitForBoot && socket.status === Socket.STATUS.PENDING) {
        socket.shouldDeferWork = () => {
          return socket.booted && socket.status !== Socket.STATUS.READY
        }

        setTimeout(() => Object.assign(socket, {booted: true}), 2000)
      }
    })

    return executor
  }
  publish = async ({relays, event, onProgress, timeout = 3000, verb = "EVENT"}) => {
    const urls = getUrls(relays)
    const executor = await this.getExecutor(urls, {bypassBoot: verb === "AUTH"})

    this.emit("publish", urls)

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
  subscribe = async ({relays, filter, onEvent, onEose, shouldProcess = true}: SubscribeOpts) => {
    const urls = getUrls(relays)
    const executor = await this.getExecutor(urls)
    const filters = ensurePlural(filter)
    const now = Date.now()
    const seen = new Map()
    const eose = new Set()

    log(`Starting subscription with ${relays.length} relays`, {filters, relays})

    this.emit("sub:open", urls)

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

        // TODO: validate that the event we asked for matches the filters we sent

        this.emit("event", {url, event})

        if (shouldProcess) {
          this.sync.processEvents([event])
        }

        onEvent(event)
      },
      onEose: url => {
        onEose?.(url)

        // Keep track of relay timing stats, but only for the first eose we get
        if (!eose.has(url)) {
          this.emit("eose", url, Date.now() - now)
        }

        eose.add(url)
      },
    })

    return {
      unsub: () => {
        log(`Closing subscription`, filters)

        sub.unsubscribe()
        executor.target.cleanup()

        this.emit("sub:close", urls)
      },
    }
  }
  count = async filter => {
    const filters = ensurePlural(filter)
    const executor = await this.getExecutor(COUNT_RELAYS)

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
}
