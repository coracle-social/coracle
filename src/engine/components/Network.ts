import {verifySignature, matchFilters} from "nostr-tools"
import {Pool, Plex, Relays, Executor, Socket} from "paravel"
import {ensurePlural, union, difference} from "hurdak"
import {warn, error, info} from "src/util/logger"
import {normalizeRelayUrl} from "src/util/nostr"
import type {Event, Filter} from "src/engine/types"
import type {Engine} from "src/engine/Engine"
import {Subscription} from "src/engine/util/Subscription"

export type Progress = {
  succeeded: Set<string>
  failed: Set<string>
  timeouts: Set<string>
  completed: Set<string>
  pending: Set<string>
}

export type PublishOpts = {
  relays: string[]
  event: Event
  onProgress: (p: Progress) => void
  timeout?: number
  verb?: string
}

export type SubscribeOpts = {
  relays: string[]
  filter: Filter[] | Filter
  onEvent?: (event: Event) => void
  onEose?: (url: string) => void
  onClose?: () => void
  timeout?: number
  shouldProcess?: boolean
}

const getUrls = (relays: string[]) => {
  if (relays.length === 0) {
    error(`Attempted to connect to zero urls`)
  }

  const urls = new Set(relays.map(normalizeRelayUrl))

  if (urls.size !== relays.length) {
    warn(`Attempted to connect to non-unique relays`)
  }

  return Array.from(urls)
}

export class Network {
  engine: Engine
  pool = new Pool()
  authHandler: (url: string, challenge: string) => void

  relayIsLowQuality = (url: string) => this.pool.get(url, {autoConnect: false})?.meta?.quality < 0.5

  getExecutor = (urls: string[], {bypassBoot = false} = {}) => {
    if (this.engine.Env.FORCE_RELAYS?.length > 0) {
      urls = this.engine.Env.FORCE_RELAYS
    }

    let target

    const muxUrl = this.engine.Settings.getSetting("multiplextr_url")

    // Try to use our multiplexer, but if it fails to connect fall back to relays. If
    // we're only connecting to a single relay, just do it directly, unless we already
    // have a connection to the multiplexer open, in which case we're probably doing
    // AUTH with a single relay.
    if (muxUrl && (urls.length > 1 || this.pool.has(muxUrl))) {
      const socket = this.pool.get(muxUrl)

      if (socket.status !== Socket.STATUS.ERROR) {
        target = new Plex(urls, socket)
      }
    }

    if (!target) {
      target = new Relays(urls.map(url => this.pool.get(url)))
    }

    const executor = new Executor(target)

    executor.handleAuth({
      onAuth: (url: string, challenge: string) => {
        return this.authHandler?.(url, challenge)
      },
      onOk: (url: string, id: string, ok: boolean, message: string) => {
        // Once we get a good auth response don't wait to send stuff to the relay
        if (ok) {
          this.pool.get(url)
          this.pool.booted = true
        }
      },
    })

    // Eagerly connect and handle AUTH
    executor.target.sockets.forEach((socket: any) => {
      const {limitation} = this.engine.Nip65.getRelayInfo(socket.url)
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

  publish = ({
    relays,
    event,
    onProgress,
    timeout = 3000,
    verb = "EVENT",
  }: PublishOpts): Promise<Progress> => {
    const urls = getUrls(relays)
    const executor = this.getExecutor(urls, {bypassBoot: verb === "AUTH"})

    info(`Publishing to ${urls.length} relays`, event, urls)

    return new Promise(resolve => {
      const timeouts = new Set<string>()
      const succeeded = new Set<string>()
      const failed = new Set<string>()

      const getProgress = () => {
        const completed = union(timeouts, succeeded, failed)
        const pending = difference(new Set(urls), completed)

        return {succeeded, failed, timeouts, completed, pending}
      }

      const attemptToResolve = () => {
        const progress = getProgress()

        if (progress.pending.size === 0) {
          resolve(progress)
          sub.unsubscribe()
          executor.target.cleanup()
        }

        onProgress?.(progress)
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
        onOk: (url: string) => {
          succeeded.add(url)
          timeouts.delete(url)
          failed.delete(url)
          attemptToResolve()
        },
        onError: (url: string) => {
          failed.add(url)
          timeouts.delete(url)
          attemptToResolve()
        },
      })

      // Report progress to start
      attemptToResolve()
    })
  }

  subscribe = ({
    relays,
    filter,
    onEose,
    onEvent,
    onClose,
    timeout,
    shouldProcess = true,
  }: SubscribeOpts) => {
    const urls = getUrls(relays)
    const executor = this.getExecutor(urls)
    const filters = ensurePlural(filter)
    const subscription = new Subscription()
    const seen = new Map()
    const eose = new Set()

    info(`Starting subscription with ${relays.length} relays`, {filters, relays})

    subscription.on("close", () => {
      sub.unsubscribe()
      executor.target.cleanup()
      onClose?.()
    })

    if (timeout) {
      setTimeout(subscription.close, timeout)
    }

    const sub = executor.subscribe(filters, {
      onEvent: (url: string, event: Event) => {
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

        if (shouldProcess) {
          this.engine.Events.queue.push(event)
        }

        onEvent?.(event)
      },
      onEose: (url: string) => {
        onEose?.(url)
        eose.add(url)

        if (timeout && eose.size === relays.length) {
          subscription.close()
        }
      },
    })

    return subscription
  }

  count = async (filter: Filter | Filter[]) => {
    const filters = ensurePlural(filter)
    const executor = this.getExecutor(this.engine.Env.COUNT_RELAYS)

    return new Promise(resolve => {
      const sub = executor.count(filters, {
        onCount: (url: string, {count}: {count: number}) => resolve(count),
      })

      setTimeout(() => {
        resolve(0)
        sub.unsubscribe()
        executor.target.cleanup()
      }, 3000)
    })
  }

  initialize(engine: Engine) {
    this.engine = engine
  }
}
