import type {Relay} from 'src/util/types'
import {get} from 'svelte/store'
import {pick, map, assoc, sortBy, uniqBy, prop} from 'ramda'
import {first} from 'hurdak/lib/hurdak'
import {Tags} from 'src/util/nostr'
import {synced} from 'src/util/misc'
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

export const relays = synced('agent/relays', [])

// Pubkey relays

export const getPubkeyRelays = (pubkey, mode = null) => {
  const filter = mode ? {pubkey, mode} : {pubkey}

  return sortByScore(map(pick(['url', 'score']), database.routes.all(filter)))
}

export const getPubkeyReadRelays = pubkey => getPubkeyRelays(pubkey, 'read')

export const getPubkeyWriteRelays = pubkey => getPubkeyRelays(pubkey, 'write')

// Multiple pubkeys

export const getAllPubkeyRelays = (pubkeys, mode = null) =>
  aggregateScores(pubkeys.map(pubkey => getPubkeyRelays(pubkey, mode)))

export const getAllPubkeyReadRelays = pubkeys =>
  aggregateScores(pubkeys.map(getPubkeyReadRelays))

export const getAllPubkeyWriteRelays = pubkeys =>
  aggregateScores(pubkeys.map(getPubkeyWriteRelays))

// Current user

export const getUserRelays = (): Array<Relay> => get(relays).map(assoc('score', 1))
export const getUserReadRelays = () => getUserRelays().filter(prop('read'))
export const getUserWriteRelays = () => getUserRelays().filter(prop('write'))

// Event-related special cases

// If we're looking for an event's parent, tags are the most reliable hint,
// but we can also look at where other people in the thread write to.
export const getRelaysForEventParent = event => {
  const tags = Tags.from(event)
  const relays = tags.relays()
  const pubkeys = tags.type("p").values().all()
  const pubkeyRelays = pubkeys.flatMap(getPubkeyWriteRelays)

  return uniqByUrl(relays.concat(pubkeyRelays).concat({url: event.seen_on}))
}

// If we're looking for an event's children, the read relays the author has
// advertised would be the most reliable option, since well-behaved clients
// will write replies there. However, this may include spam, so we may want
// to read from the current user's network's read relays instead.
export const getRelaysForEventChildren = event => {
  return uniqByUrl(getPubkeyReadRelays(event.pubkey).concat({url: event.seen_on}))
}

export const getRelayForEventHint = event => ({url: event.seen_on})

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
