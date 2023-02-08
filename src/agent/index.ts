import type {Person} from 'src/util/types'
import type {Readable} from 'svelte/store'
import {last, uniqBy, prop} from 'ramda'
import {derived, get} from 'svelte/store'
import {Tags} from 'src/util/nostr'
import pool from 'src/agent/pool'
import keys from 'src/agent/keys'
import defaults from 'src/agent/defaults'
import database from 'src/agent/database'
import {lq, db, processEvents} from 'src/agent/data'

Object.assign(window, {pool, db, database})

export {pool, keys, lq, db, database}

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

export const getRelays = (pubkey?: string) => {
  let relays = database.getPersonWithFallback(pubkey).relays

  if (!relays?.length) {
    relays = database.getPersonWithFallback(get(keys.pubkey)).relays
  }

  if (!relays?.length) {
    relays = defaults.relays
  }

  return relays
}

export const getEventRelays = event => {
  return uniqBy(
    prop('url'),
    getRelays(event.pubkey)
      .concat(Tags.from(event).relays())
      .concat({url: event.seen_on})
  )
}

export const publish = async (relays, event) => {
  const signedEvent = await keys.sign(event)

  await Promise.all([
    pool.publish(relays, signedEvent),
    processEvents(signedEvent),
  ])

  return signedEvent
}

export const load = async (relays, filter, opts?): Promise<Record<string, unknown>[]> => {
  const events = await pool.request(relays, filter, opts)

  await processEvents(events)

  return events
}

export const listen = (relays, filter, onEvent, {shouldProcess = true}: any = {}) => {
  return pool.subscribe(relays, filter, {
    onEvent: e => {
      if (shouldProcess) {
        processEvents(e)
      }

      if (onEvent) {
        onEvent(e)
      }
    },
  })
}
