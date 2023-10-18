import type {SubscriptionOpts} from "paravel"
import {Subscription, now} from "paravel"
import {assoc, map} from "ramda"
import {updateIn} from "hurdak"
import {LOCAL_RELAY_URL} from 'src/util/nostr'
import type {Event} from "src/engine/events/model"
import {projections} from "src/engine/core/projections"
import {getUrls, getExecutor} from "./executor"
import {Tracker} from "./tracker"

export type SubscribeOpts = typeof SubscriptionOpts & {
  tracker?: Tracker
  shouldProject?: boolean
  onEvent?: (e: Event) => void
  onEose?: (url: string) => void
  onClose?: (events: Event[]) => void
}

export const subscribe = (opts: SubscribeOpts) => {
  const tracker = opts.tracker || new Tracker()
  const sub = new Subscription({
    ...opts,
    hasSeen: tracker.add,
    closeOnEose: Boolean(opts.timeout),
    executor: getExecutor(getUrls(opts.relays.concat(LOCAL_RELAY_URL))),
  })

  sub.on("event", e => {
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
    const sub = subscribe(updateIn("filters", map(assoc("since", now())), opts))

    await new Promise(resolve => sub.on("close", resolve))
  }
}
