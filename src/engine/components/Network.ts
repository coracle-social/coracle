import {Pool, Plex, Relays, Executor} from "paravel"
import {noop, ensurePlural, union, difference} from "hurdak"
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
  event: Event
  relays: string[]
  onProgress?: (p: Progress) => void
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

export class Network {
  engine: Engine
  pool = new Pool()
  authHandler: (url: string, challenge: string) => void

  relayIsLowQuality = (url: string) => this.pool.get(url, {autoConnect: false})?.meta?.quality < 0.6

  getUrls = (relays: string[]) => {
    if (this.engine.Env.FORCE_RELAYS?.length > 0) {
      return this.engine.Env.FORCE_RELAYS
    }

    if (relays.length === 0) {
      error(`Attempted to connect to zero urls`)
    }

    const urls = new Set(relays.map(normalizeRelayUrl))

    if (urls.size !== relays.length) {
      warn(`Attempted to connect to non-unique relays`)
    }

    return Array.from(urls)
  }

  getExecutor = (urls: string[], {bypassBoot = false} = {}) => {
    let target

    const muxUrl = this.engine.Settings.getSetting("multiplextr_url")

    // Try to use our multiplexer, but if it fails to connect fall back to relays. If
    // we're only connecting to a single relay, just do it directly, unless we already
    // have a connection to the multiplexer open, in which case we're probably doing
    // AUTH with a single relay.
    if (muxUrl && (urls.length > 1 || this.pool.has(muxUrl))) {
      const connection = this.pool.get(muxUrl)

      if (connection.socket.isHealthy()) {
        target = new Plex(urls, connection)
      }
    }

    if (!target) {
      target = new Relays(urls.map(url => this.pool.get(url)))
    }

    const executor = new Executor(target)

    if (this.authHandler) {
      executor.handleAuth({onAuth: this.authHandler, onOk: noop})
    }

    return executor
  }

  publish = ({
    relays,
    event,
    onProgress,
    timeout = 3000,
    verb = "EVENT",
  }: PublishOpts): Promise<Progress> => {
    const urls = this.getUrls(relays)
    const executor = this.getExecutor(urls, {bypassBoot: verb === "AUTH"})

    info(`Publishing to ${urls.length} relays`, event, urls)

    return new Promise(resolve => {
      const timeouts = new Set<string>()
      const succeeded = new Set<string>()
      const failed = new Set<string>()

      const getProgress = () => {
        const completed = union(timeouts, succeeded, failed)
        const pending = difference(new Set(urls), completed)

        return {event, succeeded, failed, timeouts, completed, pending}
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
    const subscription = new Subscription({
      executor: this.getExecutor(this.getUrls(relays)),
      filters: ensurePlural(filter),
      timeout,
      relays,
    })

    info(`Starting subscription with ${relays.length} relays`, {filter, relays})

    if (onEose) subscription.on("eose", onEose)
    if (onClose) subscription.on("close", onClose)

    subscription.on("event", event => {
      if (shouldProcess) {
        this.engine.Events.queue.push(event)
      }

      onEvent?.(event)
    })

    return subscription
  }

  count = async (filter: Filter | Filter[]) => {
    const filters = ensurePlural(filter)
    const executor = this.getExecutor(this.getUrls(this.engine.Env.COUNT_RELAYS))

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
