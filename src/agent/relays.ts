import {get} from 'svelte/store'
import {sortBy, uniq, uniqBy, prop, pluck} from 'ramda'
import {createMapOf, first} from 'hurdak/lib/hurdak'
import {Tags} from 'src/util/nostr'
import {getFollows} from 'src/agent/helpers'
import database from 'src/agent/database'
import keys from 'src/agent/keys'

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


// Pubkey relays

export const getPubkeyRelays = pubkey => {
  const person = database.getPersonWithFallback(pubkey)

  return scoreRelays(pubkey, person.relays || [])
}

export const getPubkeyReadRelays = pubkey =>
  getPubkeyRelays(pubkey).filter(r => r.read !== '!')

export const getPubkeyWriteRelays = pubkey =>
  getPubkeyRelays(pubkey).filter(r => r.write !== '!')

// Multiple pubkeys

export const getAllPubkeyRelays = pubkeys =>
  aggregateScores(pubkeys.map(getPubkeyRelays))

export const getAllPubkeyReadRelays = pubkeys =>
  aggregateScores(pubkeys.map(getPubkeyReadRelays))

export const getAllPubkeyWriteRelays = pubkeys =>
  aggregateScores(pubkeys.map(getPubkeyWriteRelays))

// Current user

export const getUserRelays = () => getPubkeyRelays(get(keys.pubkey))
export const getUserReadRelays = () => getPubkeyReadRelays(get(keys.pubkey))
export const getUserWriteRelays = () => getPubkeyWriteRelays(get(keys.pubkey))

// Network relays

export const getNetworkWriteRelays = pubkey => {
  const follows = Tags.wrap(getFollows(pubkey)).values().all()
  const others = Tags.wrap(follows.flatMap(getFollows)).values().all()

  return getAllPubkeyWriteRelays(uniq(follows.concat(others)))
}

// User's network relays

export const getUserNetworkWriteRelays = () => getNetworkWriteRelays(get(keys.pubkey))

// Event-related special cases

// If we're looking for an event's parent, tags are the most reliable hint,
// but we can also look at where other people in the thread write to.
export const getRelaysForEventParent = event => {
  const tags = Tags.from(event)
  const relays = tags.relays()
  const pubkeys = tags.type("p").values().all()
  const pubkeyRelays = pubkeys.flatMap(getPubkeyWriteRelays)

  return uniqByUrl(relays.concat(pubkeyRelays).concat(event.seen_on))
}

// If we're looking for an event's children, the read relays the author has
// advertised would be the most reliable option, since well-behaved clients
// will write replies there. However, this may include spam, so we may want
// to read from the current user's network's read relays instead.
export const getRelaysForEventChildren = event => {
  return uniqByUrl(getPubkeyReadRelays(event.pubkey).concat(event.seen_on))
}

export const getRelayForEventHint = event => event.seen_on

export const getRelayForPersonHint = (pubkey, event) =>
  first(getPubkeyWriteRelays(pubkey)) || getRelayForEventHint(event)

// If we're replying or reacting to an event, we want the author to know,
// as well as anyone else who is tagged in the original event or the reply.
// Get everyone's read relays. We also want to advertise our content to
// our followers, so write to our write relays as well.
export const getEventPublishRelays = event => {
  const tags = Tags.from(event)
  const pubkeys = tags.type("p").values().all()

  return uniqByUrl(
    pubkeys
      .concat(event.pubkey)
      .concat(get(keys.pubkey))
      .flatMap(getPubkeyReadRelays)
  )
}


// Utils

const uniqByUrl = uniqBy(prop('url'))
const sortByScore = sortBy(r => -r.score)

const scoreRelays = (pubkey, relays) => {
  const routes = database.routes.all({pubkey, url: pluck('url', relays)})
  const scores = createMapOf('url', 'score', routes)

  return uniqByUrl(sortByScore(relays.map(r => ({...r, score: scores[r.url] || 0}))))
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
      const {url, score} = relay

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
