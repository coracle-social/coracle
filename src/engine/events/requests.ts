import {seconds, switcherFn} from "hurdak"
import {Worker, writable} from "@welshman/lib"
import type {TrustedEvent, SignedEvent} from "@welshman/util"
import {isSignedEvent} from "@welshman/util"
import type {LoadOpts} from "@welshman/feeds"
import {
  FeedLoader,
  Scope,
  makeRelayFeed,
  makeIntersectionFeed,
  makeUnionFeed,
  feedFromFilter,
} from "@welshman/feeds"
import {giftWrapKinds, generatePrivateKey} from "src/util/nostr"
import {env} from "src/engine/session/state"
import {user, session, nip44, nip04} from "src/engine/session/derived"
import {people} from "src/engine/people/state"
import {maxWot, getWotScore, primeWotCaches, getFollowers} from "src/engine/people/utils"
import {follows, network} from "src/engine/people/derived"
import {hints} from "src/engine/relays/utils"
import {load, publish, dvmRequest, getFilterSelections} from "src/engine/network/utils"

export const loadDeletes = () => {
  const {pubkey, deletes_last_synced = 0} = session.get()
  const since = Math.max(0, deletes_last_synced - seconds(6, "hour"))

  return load({
    relays: hints.User().getUrls(),
    filters: [{kinds: [5], authors: [pubkey], since}],
  })
}

export const loadSeen = () => {
  const {pubkey, deletes_last_synced = 0} = session.get()
  const since = Math.max(0, deletes_last_synced - seconds(6, "hour"))

  return load({
    relays: hints.WriteRelays().getUrls(),
    filters: [{kinds: [15], authors: [pubkey], since}],
  })
}

export const loadGiftWrap = () => {
  const kinds = []

  if (nip44.get().isEnabled()) {
    kinds.push(1059)
  }

  if (nip04.get().isEnabled()) {
    kinds.push(1060)
  }

  if (kinds.length > 0) {
    const {pubkey, nip59_messages_last_synced = 0} = session.get()
    const since = Math.max(0, nip59_messages_last_synced - seconds(6, "hour"))

    return load({
      skipCache: true,
      relays: hints.User().getUrls(),
      filters: [{kinds: giftWrapKinds, authors: [pubkey], since}],
    })
  }
}

export const feedLoader = new FeedLoader<TrustedEvent>({
  request: async ({relays, filters, onEvent}) => {
    if (relays.length > 0) {
      await load({filters, relays, onEvent})
    } else {
      await Promise.all(
        getFilterSelections(filters).map(({relay, filters}) =>
          load({filters, relays: [relay], onEvent}),
        ),
      )
    }
  },
  requestDVM: async ({kind, tags = [], relays = [], onEvent}) => {
    const sk = generatePrivateKey()
    const event = await dvmRequest({kind, tags, relays, sk, timeout: 3000})

    if (event) {
      onEvent(event)
    }
  },
  getPubkeysForScope: (scope: string) => {
    const $user = user.get()

    const pubkeys = switcherFn(scope, {
      [Scope.Self]: () => ($user ? [$user.pubkey] : []),
      [Scope.Follows]: () => Array.from(follows.get()),
      [Scope.Network]: () => Array.from(network.get()),
      [Scope.Followers]: () => Array.from(getFollowers($user.pubkey).map(p => p.pubkey)),
    })

    return pubkeys.length === 0 ? env.get().DEFAULT_FOLLOWS : pubkeys
  },
  getPubkeysForWOTRange: (min, max) => {
    const pubkeys = []
    const $user = user.get()
    const thresholdMin = maxWot.get() * min
    const thresholdMax = maxWot.get() * max

    primeWotCaches($user.pubkey)

    for (const person of people.get()) {
      const score = getWotScore($user.pubkey, person.pubkey)

      if (score >= thresholdMin && score <= thresholdMax) {
        pubkeys.push(person.pubkey)
      }
    }

    return pubkeys
  },
})

export const loadAll = (feed, opts: LoadOpts<TrustedEvent> = {}) => {
  const loading = writable(true)

  const stop = () => loading.set(false)

  const promise = new Promise<void>(async resolve => {
    const load = await feedLoader.getLoader(feed, {
      onEvent: opts.onEvent,
      onExhausted: () => {
        opts.onExhausted?.()
        stop()
      },
    })

    while (loading.get()) {
      await load(100)
    }

    resolve()
  })

  return {promise, loading, stop}
}

export const sync = (fromUrl, toUrl, filters) => {
  const worker = new Worker<SignedEvent>()

  worker.addGlobalHandler(event => publish({event, relays: [toUrl]}))

  const feed = makeIntersectionFeed(
    makeRelayFeed(fromUrl),
    makeUnionFeed(...filters.map(feedFromFilter)),
  )

  return loadAll(feed, {
    onEvent: e => {
      if (isSignedEvent(e)) {
        worker.push(e)
      }
    },
  })
}
