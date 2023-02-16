import type {Person} from 'src/util/types'
import type {Readable} from 'svelte/store'
import {uniq, last} from 'ramda'
import {derived, get} from 'svelte/store'
import {Tags} from 'src/util/nostr'
import {now, timedelta} from 'src/util/misc'
import database from 'src/agent/database'
import keys from 'src/agent/keys'

export const user = derived(
  [keys.pubkey, database.people as Readable<any>],
  ([pubkey, $people]) => {
    if (!pubkey) {
      return null
    }

    return ($people[pubkey] || {pubkey})
  }
) as Readable<Person>

export const getMuffle = () => {
  const $user = get(user) as Person

  if (!$user?.muffle) {
    return []
  }

  const shouldMuffle = t => Math.random() > parseFloat(last(t))

  return Tags.wrap($user.muffle.filter(shouldMuffle)).values().all()
}

export const getFollows = pubkey =>
  Tags.wrap(database.getPersonWithFallback(pubkey).petnames).type("p").values().all()

export const getNetwork = pubkey =>
  uniq(getFollows(pubkey).flatMap(getFollows))

export const getStalePubkeys = pubkeys => {
  // If we're not reloading, only get pubkeys we don't already know about
  return uniq(pubkeys).filter(pubkey => {
    const p = database.people.get(pubkey)

    return !p || p.updated_at < now() - timedelta(1, 'days')
  })
}

