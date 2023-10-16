import type {Executor} from "paravel"
import EventEmitter from "events"
import {assoc, map} from "ramda"
import {defer, updateIn} from "hurdak"
import {now} from "src/util/misc"
import {warn, info} from "src/util/logger"
import type {Event} from "src/engine/events/model"
import {projections} from "src/engine/core/projections"
import {getUrls, getExecutor} from "./executor"
import type {Filter} from "../model"
import {matchFilters, hasValidSignature} from "./filters"
import {Tracker} from "./tracker"

export type SubscriptionOpts = {
  relays: string[]
  filters: Filter[]
  timeout?: number
  tracker?: Tracker
  shouldProject?: boolean
}

export class Subscription extends EventEmitter {
  executor: typeof Executor
  opened = Date.now()
  closed: number = null
  result = defer()
  events = []
  eose = new Set()
  tracker: Tracker
  sub: {unsubscribe: () => void} = null
  id = Math.random().toString().slice(12, 16)

  constructor(readonly opts: SubscriptionOpts) {
    super()

    this.tracker = opts.tracker || new Tracker()
    this.start()
  }

  start = () => {
    const {timeout, relays, filters} = this.opts

    if (timeout) {
      setTimeout(this.close, timeout)
    }

    this.executor = getExecutor(getUrls(relays))

    // If one of our connections gets closed make sure to kill our sub
    this.executor.target.connections.forEach(con => con.on("close", this.close))

    this.sub = this.executor.subscribe(filters, {
      onEvent: this.onEvent,
      onEose: this.onEose,
    })
  }

  onEvent = (url: string, event: Event) => {
    const {filters} = this.opts
    const seen = this.tracker.add(event, url)

    if (seen) {
      return
    }

    event.content = event.content || ""

    if (!hasValidSignature(event)) {
      warn("Signature verification failed", {event})
      return
    }

    if (!matchFilters(filters, event)) {
      warn("Event failed to match filter", {filters, event})
      return
    }

    if (this.opts.shouldProject !== false) {
      projections.push(event)
    }

    this.events.push(event)

    this.emit("event", event)
  }

  onEose = (url: string) => {
    const {timeout, relays} = this.opts

    this.emit("eose", url)

    this.eose.add(url)

    if (timeout && this.eose.size === relays.length) {
      this.close()
    }
  }

  close = () => {
    if (!this.closed) {
      this.closed = Date.now()
      this.sub.unsubscribe()
      this.executor.target.connections.forEach(con => con.off("close", this.close))
      this.executor.target.cleanup()
      this.result.resolve(this.events)
      this.emit("close", this.events)
      this.removeAllListeners()
    }
  }
}

export type SubscribeOpts = SubscriptionOpts & {
  onEvent?: (e: Event) => void
  onEose?: (url: string) => void
  onClose?: (events: Event[]) => void
}

export const subscribe = (opts: SubscribeOpts) => {
  const sub = new Subscription(opts)

  info(`Starting subscription with ${opts.relays.length} relays`, {
    relays: opts.relays,
    filters: opts.filters,
  })

  if (opts.onEvent) sub.on("event", opts.onEvent)
  if (opts.onEose) sub.on("eose", opts.onEose)
  if (opts.onClose) sub.on("close", opts.onClose)

  return sub
}

export const subscribePersistent = async (opts: SubscribeOpts) => {
  /* eslint no-constant-condition: 0 */
  while (true) {
    await subscribe(opts).result

    opts = updateIn("filters", map(assoc("since", now())), opts)
  }
}
