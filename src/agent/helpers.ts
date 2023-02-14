import type {Person, MyEvent} from 'src/util/types'
import type {Readable} from 'svelte/store'
import {isEmpty, pick, identity, sortBy, uniq, reject, groupBy, last, propEq, uniqBy, prop} from 'ramda'
import {first, ensurePlural} from 'hurdak/lib/hurdak'
import {derived, get} from 'svelte/store'
import {Tags} from 'src/util/nostr'
import {now, timedelta} from 'src/util/misc'
import defaults from 'src/agent/defaults'
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

export const getFollows = pubkey => {
  const person = database.getPersonWithFallback(pubkey)

  return Tags.wrap(person.petnames || defaults.petnames).values().all()
}

export const getPersonRelays = (person, mode = 'all') => {
  const relays = isEmpty(person?.relays || []) ? defaults.relays : person.relays

  return reject(propEq(mode, '!'), relays)
}

export const getUserRelays = (mode = 'all') =>
  getPersonRelays(get(user), mode)

export const getPubkeyRelays = (pubkey, mode = 'all') =>
  getPersonRelays(database.people.get(pubkey), mode)

export const getTopRelays = (pubkeys, mode = 'all') => {
  const routes = database.routes.all({mode, pubkey: pubkeys})
  const routesByPubkey = groupBy(prop('pubkey'), routes)
  const selectRoute = k => first(sortBy(prop('score'), routesByPubkey[k] || []))

  return uniqBy(prop('url'), pubkeys.map(selectRoute).filter(identity)).map(pick(['url']))
}

export const getBestRelay = (pubkey, mode = 'all') =>
  first(getTopRelays([pubkey], mode).concat(getPubkeyRelays(pubkey, mode)))

export const getAllEventRelays = events => {
  return uniqBy(
    prop('url'),
    ensurePlural(events)
      .flatMap(event =>
        getPubkeyRelays(event.pubkey, 'write')
          .concat(Tags.from(event).relays())
          .concat({url: event.seen_on})
      )
  )
}

export const getTopEventRelays = (events: Array<MyEvent>, mode = 'all') =>
  uniqBy(
    prop('url'),
    ensurePlural(events)
      .flatMap(e => [getBestRelay(e.pubkey, mode), {url: e.seen_on}])
      .filter(identity)
  )

export const getStalePubkeys = pubkeys => {
  // If we're not reloading, only get pubkeys we don't already know about
  return uniq(pubkeys).filter(pubkey => {
    const p = database.people.get(pubkey)

    return !p || p.updated_at < now() - timedelta(1, 'days')
  })
}

