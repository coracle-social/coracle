import {last} from 'ramda'
import {derived, get} from 'svelte/store'
import {getTagValues} from 'src/util/nostr'
import pool from 'src/agent/pool'
import keys from 'src/agent/keys'
import defaults from 'src/agent/defaults'
import {db, people, getPerson, processEvents} from 'src/agent/data'

Object.assign(window, {pool, db})

export {pool, keys, db, people, getPerson}

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

export const publish = async (relays, event) => {
  const signedEvent = await keys.sign(event)

  await Promise.all([
    pool.publish(relays, signedEvent),
    processEvents(signedEvent),
  ])

  return signedEvent
}

export const load = async (relays, filter) => {
  const events = await pool.request(relays, filter)

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
