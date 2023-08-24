import {verifySignature, matchFilters} from "nostr-tools"
import EventEmitter from "events"
import {defer, tryFunc} from "hurdak"
import type {Executor} from "paravel"
import type {Event, Filter} from "src/engine/types"
import {warn} from "src/util/logger"

type SubscriptionOpts = {
  executor: typeof Executor
  relays: string[]
  filters: Filter[]
  timeout?: number
}

export class Subscription extends EventEmitter {
  opened = Date.now()
  closed: number = null
  result = defer()
  events = []
  seen = new Map()
  eose = new Set()
  sub: {unsubscribe: () => void} = null
  id = Math.random().toString().slice(12, 16)

  constructor(readonly opts: SubscriptionOpts) {
    super()

    if (opts.timeout) {
      setTimeout(this.close, opts.timeout)
    }

    this.sub = opts.executor.subscribe(opts.filters, {
      onEvent: this.onEvent,
      onEose: this.onEose,
    })
  }

  onEvent = (url: string, event: Event) => {
    const {filters} = this.opts
    const seen_on = this.seen.get(event.id)

    if (seen_on) {
      if (!seen_on.includes(url)) {
        seen_on.push(url)
      }

      return
    }

    event.seen_on = [url]
    event.content = event.content || ""

    this.seen.set(event.id, event.seen_on)

    if (!tryFunc(() => verifySignature(event))) {
      warn("Signature verification failed", {event})
      return
    }

    if (!matchFilters(filters, event)) {
      warn("Event failed to match filter", {filters, event})
      return
    }

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
      this.result.resolve(this.events)
      this.sub.unsubscribe()
      this.opts.executor.target.cleanup()
      this.emit("close", this.events)
      this.removeAllListeners()
    }
  }
}
