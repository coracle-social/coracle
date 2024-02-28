import {nip19} from "nostr-tools"
import {Tags, Address} from "paravel"
import {isShareableRelayUrl, normalizeRelayUrl as normalize, fromNostrURI} from "paravel"
import {sortBy, whereEq, pluck, uniq, nth, prop, last} from "ramda"
import {chain, displayList, first} from "hurdak"
import {fuzzy} from "src/util/misc"
import {warn} from "src/util/logger"
import {LOCAL_RELAY_URL} from "src/util/nostr"
import type {Event} from "src/engine/events/model"
import {env} from "src/engine/session/state"
import {stateKey} from "src/engine/session/derived"
import {people} from "src/engine/people/state"
import {groups, groupSharedKeys} from "src/engine/groups/state"
import {pool} from "src/engine/network/state"
import {getSetting} from "src/engine/session/utils"
import type {Relay} from "./model"
import {RelayMode} from "./model"

export const normalizeRelayUrl = (url: string) => {
  if (url === LOCAL_RELAY_URL) {
    return url
  }

  try {
    return normalize(url)
  } catch (e) {
    return url
  }
}

export const urlToRelay = url => ({url: normalizeRelayUrl(url)}) as Relay

export const decodeRelay = entity => {
  entity = fromNostrURI(entity)

  try {
    return {url: nip19.decode(entity).data}
  } catch (e) {
    return {url: entity}
  }
}

export const relayIsLowQuality = (url: string) =>
  pool.get(url, {autoConnect: false})?.meta?.quality < 0.6

export const displayRelay = ({url}: Relay) => last(url.split("://")).replace(/\/$/, "")

export const displayRelays = (relays: Relay[], max = 3) =>
  displayList(relays.map(displayRelay), "and", max)

export const getRelaySearch = $relays => fuzzy($relays, {keys: ["url", "name", "description"]})

export const getSearchableRelays = ($relays: Relay[]) => {
  const urls = pluck(
    "url",
    $relays.filter(r => (r.info?.supported_nips || []).includes(50)),
  )

  return uniq(env.get().SEARCH_RELAYS.concat(urls)).slice(0, 8) as string[]
}

export const getPubkeyRelays = (pubkey: string, mode: string = null) => {
  const relays = people.key(pubkey).get()?.relays || []

  return mode ? relays.filter(prop(mode)) : relays
}

export const getPubkeyRelayUrls = (pubkey: string, mode: string = null) =>
  pluck("url", getPubkeyRelays(pubkey, mode))

export const getUserRelays = (mode: string = null) => getPubkeyRelays(stateKey.get(), mode)

export const getUserRelayUrls = (mode: string = null) => pluck("url", getUserRelays(mode))

export const getGroupRelayUrls = address => {
  const group = groups.key(address).get()
  const keys = groupSharedKeys.get()

  if (group?.relays) {
    return group.relays
  }

  const latestKey = last(sortBy(prop("created_at"), keys.filter(whereEq({group: address}))))

  if (latestKey?.hints) {
    return latestKey.hints
  }

  return []
}

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

export const selectHints = (hints: Iterable<string>, limit: number = null) => {
  const {FORCE_RELAYS} = env.get()
  const seen = new Set()
  const ok = []
  const bad = []

  if (!limit) {
    limit = getSetting("relay_limit")
  }

  for (const url of FORCE_RELAYS.length > 0 ? FORCE_RELAYS : hints) {
    if (seen.has(url)) {
      continue
    }

    seen.add(url)

    // Skip relays that just shouldn't ever be published
    if (!isShareableRelayUrl(url)) {
      continue
    }

    // Filter out relays that appear to be broken or slow
    if (relayIsLowQuality(url)) {
      bad.push(url)
    } else {
      ok.push(url)
    }

    if (ok.length > limit) {
      break
    }
  }

  // If we don't have enough hints, use the broken ones
  const result = ok.concat(bad).slice(0, limit)

  if (result.length === 0) {
    warn("No results returned from selectHints")
  }

  return result
}

export const selectHintsWithFallback = (hints: Iterable<string> = null, limit = null) =>
  selectHints(chain(hints || [], getUserRelayUrls(RelayMode.Read), env.get().DEFAULT_RELAYS), limit)

export class HintSelector {
  constructor(
    readonly generateHints,
    readonly hintsLimit = null,
  ) {}

  limit = hintsLimit => new HintSelector(this.generateHints, hintsLimit)

  getHints = (...args) =>
    selectHints(this.generateHints(...args), this.hintsLimit || getSetting("relay_limit"))
}

export const hintSelector = (generateHints: (...args: any[]) => Iterable<string>) => {
  const selector = new HintSelector(generateHints)
  const getHints = selector.getHints

  ;(getHints as any).limit = selector.limit

  return getHints as typeof getHints & {limit: typeof selector.limit}
}

export const getPubkeyHints = hintSelector(function* (pubkey: string, mode: RelayMode) {
  yield* getPubkeyRelayUrls(pubkey, mode)
})

export const getPubkeyHint = (pubkey: string): string =>
  first(getPubkeyHints(pubkey, "write")) || ""

export const getUserHints = hintSelector(function* (mode: RelayMode) {
  yield* getUserRelayUrls(mode)
})

export const getUserHint = (pubkey: string): string => first(getUserHints(1, "write")) || ""

export const getEventHints = hintSelector(function* (event: Event) {
  for (const address of Tags.fromEvent(event).context().values().valueOf()) {
    yield* getGroupHints(address)
  }

  yield* getPubkeyRelayUrls(event.pubkey, RelayMode.Write)
  yield* event.seen_on?.filter(isShareableRelayUrl) || []
})

export const getEventHint = (event: Event) => first(getEventHints.limit(1).getHints(event)) || ""

// If we're looking for an event's children, the read relays the author has
// advertised would be the most reliable option, since well-behaved clients
// will write replies there.
export const getReplyHints = hintSelector(function* (event) {
  for (const address of Tags.fromEvent(event).context().values().valueOf()) {
    yield* getGroupHints(address)
  }

  yield* getPubkeyRelayUrls(event.pubkey, RelayMode.Read)
})

// If we're looking for an event's parent, tags are the most reliable hint,
// but we can also look at where the author of the note reads from
export const getParentHints = hintSelector(function* (event) {
  yield* Tags.fromEvent(event).replies().relays().valueOf()
  yield* getPubkeyRelayUrls(event.pubkey, RelayMode.Read)
})

export const getRootHints = hintSelector(function* (event) {
  yield* Tags.fromEvent(event).roots().relays().valueOf()
  yield* getPubkeyRelayUrls(event.pubkey, RelayMode.Read)
})

// If we're replying or reacting to an event, we want the author to know, as well as
// anyone else who is tagged in the original event or the reply. Get everyone's read
// relays. Limit how many per pubkey we publish to though. We also want to advertise
// our content to our followers, so publish to our write relays as well.
export const getPublishHints = hintSelector(function* (event: Event) {
  for (const address of Tags.fromEvent(event).context().values().valueOf()) {
    yield* getGroupHints(address)
  }

  const pubkeys = Tags.fromEvent(event).values("p").valueOf()
  const hintGroups = pubkeys.map(pubkey => getPubkeyRelayUrls(pubkey, RelayMode.Read))
  const authorRelays = getPubkeyRelayUrls(event.pubkey, RelayMode.Write)

  yield* mergeHints([...hintGroups, authorRelays, getUserHints(RelayMode.Write)])
})

export const getInboxHints = hintSelector(function* (pubkeys: string[]) {
  yield* mergeHints(pubkeys.map(pk => getPubkeyHints(pk, "read")))
})

export const getGroupHints = hintSelector(function* (address: string) {
  yield* getGroupRelayUrls(address)
  yield* getPubkeyHints(Address.fromRaw(address).pubkey)
})

export const getGroupHint = (address: string): string => first(getGroupHints(address)) || ""

export const getGroupPublishHints = (addresses: string[]) => {
  const urls = mergeHints(addresses.map(getGroupRelayUrls))

  return urls.length === 0 ? getUserHints("write") : urls
}

export const mergeHints = (groups: string[][], limit: number = null) => {
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
    .slice(0, limit || getSetting("relay_limit"))
}
