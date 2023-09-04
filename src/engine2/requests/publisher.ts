import EventEmitter from "events"
import {omit} from "ramda"
import {defer, union, difference} from "hurdak"
import {info} from "src/util/logger"
import type {Event} from "src/engine2/model"
import {getUrls, getExecutor} from "./executor"

export type PublisherOpts = {
  event: Event
  relays: string[]
  timeout?: number
  verb?: string
}

export class Publisher extends EventEmitter {
  result = defer()

  constructor(readonly opts: PublisherOpts) {
    super()

    const {verb, relays, event, timeout} = opts

    if (event.wrap) {
      throw new Error("Can't publish unwrapped events")
    }

    const urls = getUrls(relays)
    const executor = getExecutor(urls, {bypassBoot: verb === "AUTH"})

    info(`Publishing to ${urls.length} relays`, event, urls)

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

    const sub = executor.publish(omit(["seen_on"], event), {
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
