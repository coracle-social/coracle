import type {Relay} from 'src/util/types'
import LRUCache from 'lru-cache'
import {warn} from 'src/util/logger'
import {filter, pipe, pick, groupBy, objOf, map, assoc, sortBy, uniqBy, prop} from 'ramda'
import {first, createMap} from 'hurdak/lib/hurdak'
import {Tags, isRelay, findReplyId} from 'src/util/nostr'
import {shuffle, fetchJson} from 'src/util/misc'
import database from 'src/agent/database'
import pool from 'src/agent/pool'
import user from 'src/agent/user'

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

// Initialize our database

export const initializeRelayList = async () => {
  // Throw some hardcoded defaults in there
  await database.relays.bulkPatch(
    createMap('url', [
      {url: 'wss://brb.io'},
      {url: 'wss://nostr.zebedee.cloud'},
      {url: 'wss://nostr-pub.wellorder.net'},
      {url: 'wss://relay.nostr.band'},
      {url: 'wss://nostr.pleb.network'},
      {url: 'wss://relay.nostrich.de'},
      {url: 'wss://relay.damus.io'},
    ])
  )

  // Load relays from nostr.watch via dufflepud
  try {
    const url = import.meta.env.VITE_DUFFLEPUD_URL + '/relay'
    const json = await fetchJson(url)
    const relays = json.relays.filter(isRelay)

    await database.relays.bulkPatch(createMap('url', map(objOf('url'), relays)))
  } catch (e) {
    warn("Failed to fetch relays list", e)
  }
}

// Pubkey relays

const _getPubkeyRelaysCache = new LRUCache({max: 1000})

export const getPubkeyRelays = (pubkey, mode = null, routes = null) => {
  const filter = mode ? {pubkey, mode} : {pubkey}
  const key = [mode, pubkey].join(':')

  let result = routes || _getPubkeyRelaysCache.get(key)
  if (!result) {
     result = database.routes.all(filter)
     _getPubkeyRelaysCache.set(key, result)
  }

  return sortByScore(map(pick(['url', 'score']), result))
}

export const getPubkeyReadRelays = pubkey => getPubkeyRelays(pubkey, 'read')

export const getPubkeyWriteRelays = pubkey => getPubkeyRelays(pubkey, 'write')

// Multiple pubkeys

export const getAllPubkeyRelays = (pubkeys, mode = null) => {
  // As an optimization, filter the database once and group by pubkey
  const filter = mode ? {pubkey: pubkeys, mode} : {pubkey: pubkeys}
  const routesByPubkey = groupBy(prop('pubkey'), database.routes.all(filter))

  return aggregateScores(
    pubkeys.map(
      pubkey => getPubkeyRelays(pubkey, mode, routesByPubkey[pubkey] || [])
    )
  )
}

export const getAllPubkeyReadRelays = pubkeys => getAllPubkeyRelays(pubkeys, 'read')

export const getAllPubkeyWriteRelays = pubkeys => getAllPubkeyRelays(pubkeys, 'write')

// Current user

export const getUserRelays = () =>
  user.getRelays().map(assoc('score', 1))

export const getUserReadRelays = () =>
  getUserRelays().filter(prop('read')).map(pick(['url', 'score']))

export const getUserWriteRelays = (): Array<Relay> =>
  getUserRelays().filter(prop('write')).map(pick(['url', 'score']))

// Event-related special cases

// If we're looking for an event's parent, tags are the most reliable hint,
// but we can also look at where the author of the note reads from
export const getRelaysForEventParent = event => {
  const parentId = findReplyId(event)
  const relayHints = Tags.from(event).equals(parentId).relays()
  const pubkeyRelays = getPubkeyReadRelays(event.pubkey)

  return uniqByUrl(relayHints.concat({url: event.seen_on}).concat(pubkeyRelays))
}

// If we're looking for an event's children, the read relays the author has
// advertised would be the most reliable option, since well-behaved clients
// will write replies there. However, this may include spam, so we may want
// to read from the current user's network's read relays instead.
export const getRelaysForEventChildren = event => {
  return uniqByUrl(getPubkeyReadRelays(event.pubkey)
    .concat({url: event.seen_on, score: 1}))
}

export const getRelayForEventHint = event =>
  ({url: event.seen_on, score: 1})

export const getRelayForPersonHint = (pubkey, event) =>
  first(getPubkeyWriteRelays(pubkey)) || getRelayForEventHint(event)

// If we're replying or reacting to an event, we want the author to know, as well as
// anyone else who is tagged in the original event or the reply. Get everyone's read
// relays. Limit how many per pubkey we publish to though. We also want to advertise
// our content to our followers, so write to our write relays as well.
export const getEventPublishRelays = event => {
  const tags = Tags.from(event)
  const pubkeys = tags.type("p").values().all().concat(event.pubkey)
  const relayChunks = pubkeys.map(pubkey => getPubkeyReadRelays(pubkey).slice(0, 3))

  return uniqByUrl(aggregateScores(relayChunks).concat(getUserWriteRelays()))
}


// Utils

export const uniqByUrl = pipe(uniqBy(prop('url')), filter(prop('url')))

export const sortByScore = sortBy(r => -r.score)

export const sampleRelays = (relays, scale = 1) => {
  let limit = user.getSetting('relayLimit')

  // Allow the caller to scale down how many relays we're bothering depending on
  // the use case, but only if we have enough relays to handle it
  if (limit > 10) {
    limit *= scale
  }

  // Remove relays that are currently in an error state
  relays = relays.filter(r => !pool.getConnection(r.url)?.hasRecentError())

  // Limit target relays
  relays = relays.slice(0, limit)

  // If we're still under the limit, add user relays for good measure
  if (relays.length < limit) {
    relays = relays.concat(
      shuffle(getUserReadRelays()).slice(0, limit - relays.length)
    )
  }

  return uniqByUrl(relays)
}

export const aggregateScores = relayGroups => {
  const scores = {} as Record<string, {
    score: number,
    count: number,
    weight?: number,
    weightedScore?: number
  }>

  for (const relays of relayGroups) {
    for (const relay of relays) {
      const {url, score = 0.5} = relay

      if (!scores[url]) {
        scores[url] = {score: 0, count: 0}
      }

      scores[url].score += score
      scores[url].count += 1
    }
  }

  // Use the log-sum-exp and a weighted sum
  for (const score of Object.values(scores)) {
    score.weight = Math.log(relayGroups.length / score.count)
    score.weightedScore = score.weight + Math.log1p(Math.exp(score.score - score.count))
  }

  return sortByScore(
    Object.entries(scores)
      .map(([url, {weightedScore}]) => ({url, score: weightedScore}))
  )
}
