import type {SubscriptionOpts} from "paravel"
import {Subscription, now} from "paravel"
import {assoc, map} from "ramda"
import {updateIn, sleep} from "hurdak"
import {LOCAL_RELAY_URL} from "src/util/nostr"
import type {Event} from "src/engine/events/model"
import {deletes} from "src/engine/events/state"
import {projections} from "src/engine/core/projections"
import {getUrls, getExecutor} from "./executor"
import {Tracker} from "./tracker"

export type SubscribeOpts = typeof SubscriptionOpts & {
  tracker?: Tracker
  skipCache?: boolean
  shouldProject?: boolean
  onEvent?: (e: Event) => void
  onEose?: (url: string) => void
  onClose?: (events: Event[]) => void
}

export const subscribe = (opts: SubscribeOpts) => {
  const $deletes = deletes.get()
  const tracker = opts.tracker || new Tracker()
  const relays = opts.skipCache ? opts.relays : opts.relays.concat(LOCAL_RELAY_URL)
  const sub = new Subscription({
    ...opts,
    hasSeen: tracker.add,
    executor: getExecutor(getUrls(relays)),
    shouldValidate: (e, url) => {
      // Don't re-validate stuff from the cache
      if (url === LOCAL_RELAY_URL) {
        return false
      }

      return true
    },
  })

  sub.on("event", e => {
    if ($deletes.has(e.id)) {
      return
    }

    opts.onEvent?.(e)

    if (opts.shouldProject !== false) {
      projections.push(e)
    }
  })

  if (opts.onEose) sub.on("eose", opts.onEose)
  if (opts.onClose) sub.on("close", opts.onClose)

  return sub
}

export const subscribePersistent = async (opts: SubscribeOpts) => {
  /* eslint no-constant-condition: 0 */
  while (true) {
    console.log('========')
    // If the subscription gets closed quickly due to eose, don't start flapping
    await Promise.all([
      sleep(30_000),
      new Promise(resolve => subscribe(opts).on("close", resolve))
    ])
  }
}
