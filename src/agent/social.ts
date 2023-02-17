import {uniq} from 'ramda'
import {get} from 'svelte/store'
import {Tags} from 'src/util/nostr'
import database from 'src/agent/database'
import {follows} from 'src/agent/user'

export const getFollows = pubkey =>
  Tags.wrap(database.getPersonWithFallback(pubkey).petnames).type("p").values().all()

export const getNetwork = pubkey => {
  const follows = getFollows(pubkey)

  return uniq(follows.concat(follows.flatMap(getFollows)))
}

export const getUserFollows = (): Array<string> => get(follows.pubkeys)

export const getUserNetwork = () => {
  const follows = getUserFollows()

  return uniq(follows.concat(follows.flatMap(getFollows)))
}
