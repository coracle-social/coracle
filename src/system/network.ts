import type {Filter} from "nostr-tools"
import type {MyEvent} from "src/util/types"
import {EventEmitter} from "events"
import {verifySignature, matchFilters} from "nostr-tools"
import {Pool, Plex, Relays, Executor, Socket} from "paravel"
import {ensurePlural} from "hurdak/lib/hurdak"
import {union, difference} from "src/util/misc"
import {warn, error, log} from "src/util/logger"
import {normalizeRelayUrl} from "src/util/nostr"
import {FORCE_RELAYS, COUNT_RELAYS} from "src/system/env"
import type {System} from "src/system/system"

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

export class Network extends EventEmitter {
  authHandler?: (url: string, challenge: string) => void
  system: System
  pool: Pool
  constructor(system) {
    super()

    this.authHandler = null
    this.system = system
    this.pool = new Pool()
  }
  getExecutor = (urls, {bypassBoot = false} = {}) => {
    if (FORCE_RELAYS.length > 0) {
      urls = FORCE_RELAYS
    }

    let target

    const muxUrl = this.system.user.getSetting("multiplextr_url")

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
      const {limitation} = this.system.routing.getRelayInfo(socket.url)
      const waitForBoot = limitation?.payment_required || limitation?.auth_required

      // This happens automatically, but kick it off anyway
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
  publish = ({relays, event, onProgress, timeout = 3000, verb = "EVENT"}) => {
    const urls = getUrls(relays)
    const executor = this.getExecutor(urls, {bypassBoot: verb === "AUTH"})

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
  subscribe = ({relays, filter, onEvent, onEose, shouldProcess = true}: SubscribeOpts) => {
    const urls = getUrls(relays)
    const executor = this.getExecutor(urls)
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

        if (!matchFilters(filters, event)) {
          return
        }

        this.emit("event", {url, event})

        if (shouldProcess) {
          this.system.sync.processEvents([event])
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

    let closed = false

    return () => {
      if (closed) {
        error("Closed subscription twice", filters)
      } else {
        log(`Closing subscription`, filters)
      }

      sub.unsubscribe()
      executor.target.cleanup()

      this.emit("sub:close", urls)

      closed = true
    }
  }
  load = ({
    relays,
    filter,
    onEvent = null,
    shouldProcess = true,
    timeout = 5000,
  }: {
    relays: string[]
    filter: Filter | Filter[]
    onEvent?: (event: MyEvent) => void
    shouldProcess?: boolean
    timeout?: number
  }) => {
    return new Promise(resolve => {
      let completed = false
      const eose = new Set()
      const allEvents = []

      const attemptToComplete = force => {
        // If we've already unsubscribed we're good
        if (completed) {
          return
        }

        const isDone = eose.size === relays.length

        if (force) {
          relays.forEach(url => {
            if (!eose.has(url)) {
              this.pool.emit("timeout", url)
            }
          })
        }

        if (isDone || force) {
          unsubscribe()
          resolve(allEvents)
          completed = true
        }
      }

      // If a relay takes too long, give up
      setTimeout(() => attemptToComplete(true), timeout)

      const unsubscribe = this.subscribe({
        relays,
        filter,
        shouldProcess,
        onEvent: event => {
          onEvent?.(event)
          allEvents.push(event)
        },
        onEose: url => {
          eose.add(url)
          attemptToComplete(false)
        },
      })
    }) as Promise<MyEvent[]>
  }
  count = async filter => {
    const filters = ensurePlural(filter)
    const executor = this.getExecutor(COUNT_RELAYS)

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
