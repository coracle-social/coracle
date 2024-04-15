import {seconds} from "hurdak"
import {Worker} from "@coracle.social/lib"
import type {Event} from "@coracle.social/util"
import {FeedLoader, Scope, relayFeed, filterFeed} from "@coracle.social/feeds"
import {giftWrapKinds, generatePrivateKey} from "src/util/nostr"
import {user, session, nip44, nip04} from "src/engine/session/derived"
import {people} from "src/engine/people/state"
import {
  maxWot,
  getWotScore,
  primeWotCaches,
  getFollowers,
  getFollowedPubkeys,
} from "src/engine/people/utils"
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

export const feedLoader = new FeedLoader({
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
  requestDvm: async ({kind, tags = [], onEvent}) => {
    const sk = generatePrivateKey()
    const event = await dvmRequest({kind, tags, sk, timeout: 3000})

    if (event) {
      onEvent(event)
    }
  },
  getPubkeysForScope: (scope: string) => {
    const $user = user.get()

    switch (scope) {
      case Scope.Self:
        return $user ? [$user.pubkey] : []
      case Scope.Follows:
        return getFollowedPubkeys($user)
      case Scope.Followers:
        return Array.from(getFollowers($user.pubkey).map(p => p.pubkey))
      default:
        throw new Error(`Invalid scope ${scope}`)
    }
  },
  getPubkeysForWotRange: (min, max) => {
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

export const sync = async (fromUrl, toUrl, filters) => {
  const worker = new Worker<Event>()

  worker.addGlobalHandler(event => publish({event, relays: [toUrl]}))

  const feed = relayFeed([fromUrl], filterFeed(...filters))

  let exhausted = false

  const load = await feedLoader.getLoader(feed, {
    onEvent: worker.push,
    onExhausted: () => {
      exhausted = true
    },
  })

  while (!exhausted) {
    await load(100)
  }
}
