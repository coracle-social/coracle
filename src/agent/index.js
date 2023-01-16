import {last, uniq} from 'ramda'
import {derived, get} from 'svelte/store'
import {getTagValues, Tags} from 'src/util/nostr'
import pool from 'src/agent/pool'
import keys from 'src/agent/keys'
import defaults from 'src/agent/defaults'
import {db, people, ready, getPerson, processEvents} from 'src/agent/data'

Object.assign(window, {pool, db})

export {pool, keys, db, ready, people, getPerson}

export const user = derived(
  [keys.pubkey, people],
  ([pubkey, $people]) => {
    if (!pubkey) {
      return null
    }

    return $people[pubkey] || {pubkey}
  }
)

export const getMuffle = () => {
  const $user = get(user)

  if (!$user?.muffle) {
    return []
  }

  return getTagValues($user.muffle.filter(t => Math.random() < last(t)))
}

export const getFollows = pubkey => {
  const person = getPerson(pubkey)

  return getTagValues(person?.petnames || defaults.petnames)
}

export const getRelays = pubkey => {
  let relays = getPerson(pubkey)?.relays

  if (!relays?.length) {
    relays = getPerson(get(keys.pubkey))?.relays
  }

  if (!relays?.length) {
    relays = defaults.relays
  }

  return relays
}

export const getEventRelays = event => {
  if (event.seen_on) {
    return [event.seen_on]
  }

  return uniq(getRelays(event.pubkey).concat(Tags.from(event).relays()))
}

export const publish = async (relays, event) => {
  const signedEvent = await keys.sign(event)

  await Promise.all([
    pool.publish(relays, signedEvent),
    processEvents(signedEvent),
  ])

  return signedEvent
}

export const load = async (relays, filter, opts) => {
  const events = await pool.request(relays, filter, opts)

  await processEvents(events)

  return events
}

export const listen = async (relays, filter, onEvent, {shouldProcess = true} = {}) => {
  const sub = await pool.subscribe(relays, filter)

  sub.onEvent(e => {
    if (shouldProcess) {
      processEvents(e)
    }

    if (onEvent) {
      onEvent(e)
    }
  })

  return sub
}
