import EventEmitter from "events"
import {omit} from "ramda"
import {defer, union, difference} from "hurdak"
import {info} from "src/util/logger"
import type {Event} from "src/engine2/model"
import {getUrls, getExecutor} from "src/engine2/queries"

export type PublishOpts = {
  timeout?: number
  verb?: string
}

export type StaticPublishOpts = PublishOpts & {
  event: Event
  relays: string[]
}

export class Publisher extends EventEmitter {
  result = defer()

  constructor(readonly event: Event) {
    super()

    if (event.wrap) {
      throw new Error("Can't publish unwrapped events")
    }
  }

  static publish({event, relays, ...opts}: StaticPublishOpts) {
    const publisher = new Publisher(event)

    publisher.publish(relays, opts)

    return publisher
  }

  publish(relays, {timeout, verb}: PublishOpts = {}) {
    const urls = getUrls(relays)
    const executor = getExecutor(urls, {bypassBoot: verb === "AUTH"})

    info(`Publishing to ${urls.length} relays`, this.event, urls)

    const timeouts = new Set<string>()
    const succeeded = new Set<string>()
    const failed = new Set<string>()

    const getProgress = () => {
      const completed = union(timeouts, succeeded, failed)
      const pending = difference(new Set(urls), completed)

      return {event: this.event, succeeded, failed, timeouts, completed, pending}
    }

    const attemptToResolve = () => {
      const progress = getProgress()

      if (progress.pending.size === 0) {
        sub.unsubscribe()
        executor.target.cleanup()
        this.result.resolve(progress)
      }

      this.emit("progress", progress)
    }

    setTimeout(() => {
      for (const url of urls) {
        if (!succeeded.has(url) && !failed.has(url)) {
          timeouts.add(url)
        }
      }

      attemptToResolve()
    }, timeout)

    const sub = executor.publish(omit(["seen_on"], this.event), {
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

    // Report progress to start with
    attemptToResolve()
  }
}
