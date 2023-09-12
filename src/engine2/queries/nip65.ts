import {sortBy, pluck, uniq, nth, prop, last} from "ramda"
import {chain} from "hurdak"
import {fuzzy} from "src/util/misc"
import {findReplyId, normalizeRelayUrl, findRootId, isShareableRelay, Tags} from "src/util/nostr"
import type {Event, Relay} from "src/engine2/model"
import {RelayMode} from "src/engine2/model"
import {env, pool, relays, people} from "src/engine2/state"
import {stateKey, user} from "src/engine2/queries/session"

export const relayPolicies = user.derived($user => $user.relays || [])

export const relayPolicyUrls = relayPolicies.derived(pluck("url"))

export const hasRelay = url => relayPolicyUrls.derived(urls => urls.includes(url))

export const relayIsLowQuality = (url: string) =>
  pool.get(url, {autoConnect: false})?.meta?.quality < 0.6

export const displayRelay = ({url}: Relay) => last(url.split("://"))

export const getRelaySearch = $relays => fuzzy($relays, {keys: ["url", "name", "description"]})

export const searchRelays = relays.derived(getRelaySearch)

export const urlToRelay = url => ({url: normalizeRelayUrl(url)} as Relay)

export const searchableRelays = relays.derived($relays => {
  const urls = $relays.filter(r => (r.info?.supported_nips || []).includes(50)).map(prop("url"))

  return uniq(env.get().SEARCH_RELAYS.concat(urls)).slice(0, 8) as string[]
})

export const getPubkeyRelays = (pubkey: string, mode: string = null) => {
  const relays = people.key(pubkey).get()?.relays || []

  return mode ? relays.filter(prop(mode)) : relays
}

export const getPubkeyRelayUrls = (pubkey: string, mode: string = null) =>
  pluck("url", getPubkeyRelays(pubkey, mode))

export const getUserRelays = (mode: string = null) => getPubkeyRelays(stateKey.get(), mode)

export const getUserRelayUrls = (mode: string = null) => pluck("url", getUserRelays(mode))

// Smart relay selection
//
// From Mike Dilger:
// 1) Other people's write relays — pull events from people you follow,
//    including their contact lists
// 2) Other people's read relays — push events that tag them (replies or just tagging).
//    However, these may be authenticated, use with caution
// 3) Your write relays —- write events you post to your microblog feed for the
//    world to see.  ALSO write your contact list.  ALSO read back your own contact list.
// 4) Your read relays —- read events that tag you.  ALSO both write and read
//    client-private data like client configuration events or anything that the world
//    doesn't need to see.
// 5) Advertise relays — write and read back your own relay list

export const selectHints = (limit: number | null, hints: Iterable<string>) => {
  const seen = new Set()
  const ok = []
  const bad = []

  for (const url of chain(hints, getUserRelayUrls(RelayMode.Read), env.get().DEFAULT_RELAYS)) {
    if (seen.has(url)) {
      continue
    }

    seen.add(url)

    // Filter out relays that appear to be broken or slow
    if (!isShareableRelay(url)) {
      bad.push(url)
    } else if (relayIsLowQuality(url)) {
      bad.push(url)
    } else {
      ok.push(url)
    }

    if (limit && ok.length > limit) {
      break
    }
  }

  // If we don't have enough hints, use the broken ones
  return ok.concat(bad).slice(0, limit || Infinity)
}

export const hintSelector =
  (generateHints: (...args: any[]) => Iterable<string>) =>
  (limit: number, ...args: any[]) =>
    selectHints(limit, generateHints(...args))

export const getPubkeyHints = hintSelector(function* (pubkey: string, mode: RelayMode) {
  yield* getPubkeyRelayUrls(pubkey, mode)
})

export const getEventHints = hintSelector(function* (event: Event) {
  yield* getPubkeyRelayUrls(event.pubkey, RelayMode.Write)
})

// If we're looking for an event's children, the read relays the author has
// advertised would be the most reliable option, since well-behaved clients
// will write replies there.
export const getReplyHints = hintSelector(function* (event) {
  yield* getPubkeyRelayUrls(event.pubkey, RelayMode.Read)
})

// If we're looking for an event's parent, tags are the most reliable hint,
// but we can also look at where the author of the note reads from
export const getParentHints = hintSelector(function* (event) {
  const parentId = findReplyId(event)

  yield* Tags.from(event).equals(parentId).relays()
  yield* getPubkeyRelayUrls(event.pubkey, RelayMode.Read)
})

export const getRootHints = hintSelector(function* (event) {
  const rootId = findRootId(event)

  yield* Tags.from(event).equals(rootId).relays()
  yield* getPubkeyRelayUrls(event.pubkey, RelayMode.Read)
})

// If we're replying or reacting to an event, we want the author to know, as well as
// anyone else who is tagged in the original event or the reply. Get everyone's read
// relays. Limit how many per pubkey we publish to though. We also want to advertise
// our content to our followers, so publish to our write relays as well.
export const getPublishHints = (limit: number, event: Event) => {
  const pubkeys = Tags.from(event).type("p").values().all()
  const hintGroups = pubkeys.map(pubkey => getPubkeyRelayUrls(pubkey, RelayMode.Read))
  const authorRelays = getPubkeyRelayUrls(event.pubkey, RelayMode.Write)

  return mergeHints(limit, [...hintGroups, authorRelays, getUserRelayUrls(RelayMode.Write)])
}

export const getInboxHints = (limit: number, pubkeys: string[]) =>
  mergeHints(
    limit,
    pubkeys.map(pk => getPubkeyHints(limit, pk, "read"))
  )

export const mergeHints = (limit: number, groups: string[][]) => {
  const scores = {} as Record<string, any>

  for (const hints of groups) {
    hints.forEach((hint, i) => {
      const score = 1 / (i + 1) / hints.length

      if (!scores[hint]) {
        scores[hint] = {score: 0, count: 0}
      }

      scores[hint].score += score
      scores[hint].count += 1
    })
  }

  // Use the log-sum-exp and a weighted sum
  for (const score of Object.values(scores)) {
    const weight = Math.log(groups.length / score.count)

    score.score = weight + Math.log1p(Math.exp(score.score - score.count))
  }

  return sortBy(([hint, {score}]) => score, Object.entries(scores))
    .map(nth(0))
    .slice(0, limit)
}
