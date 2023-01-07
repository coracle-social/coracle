import {without, reject} from 'ramda'
import {first} from 'hurdak/lib/hurdak'
import {get} from 'svelte/store'
import {getPerson, keys, db} from 'src/agent'
import {toast, modal, settings} from 'src/app/ui'
import cmd from 'src/app/cmd'
import alerts from 'src/app/alerts'
import loaders from 'src/app/loaders'
import defaults from 'src/app/defaults'

export {toast, modal, settings, alerts}

export const getRelays = pubkey => {
  const person = getPerson(pubkey)

  return person && person.relays.length > 0 ? person.relays : defaults.relays
}

export const getBestRelay = pubkey => {
  const person = getPerson(pubkey)

  if (!person) {
    return null
  }

  return person.relays.length > 0 ? first(person.relays) : person.recommendedRelay
}

export const login = async ({privkey, pubkey}) => {
  if (privkey) {
    keys.setPrivateKey(privkey)
  } else {
    keys.setPublicKey(pubkey)
  }

  await loaders.loadNetwork(getRelays(), pubkey)
  await alerts.listen(getRelays(), pubkey)
}

export const logout = async () => {
  keys.clear()

  await db.tags.clear()
  await db.events.clear()
}

export const addRelay = async url => {
  const pubkey = get(keys.pubkey)
  const person = getPerson(pubkey)
  const relays = person?.relays || []

  await cmd.setRelays(relays.concat(url))
  await loaders.loadNetwork(relays, pubkey)
  await alerts.listen(relays, pubkey)
}

export const removeRelay = async url => {
  const pubkey = get(keys.pubkey)
  const person = getPerson(pubkey)
  const relays = person?.relays || []

  await cmd.setRelays(without([url], relays))
}

export const follow = async targetPubkey => {
  const pubkey = get(keys.pubkey)
  const person = getPerson(pubkey)
  const petnames = person?.petnames || []
  const target = getPerson(targetPubkey)
  const relay = (
    getBestRelay(targetPubkey)
    || getBestRelay(pubkey)
    || first(defaults.relays)
  )

  await cmd.setPetnames(
    reject(t => t[1] === targetPubkey, petnames)
      .concat([["p", pubkey, relay, target?.name || ""]])
  )

  await loaders.loadNetwork(getRelays(), pubkey)
}

export const unfollow = async targetPubkey => {
  const pubkey = get(keys.pubkey)
  const person = getPerson(pubkey)
  const petnames = person?.petnames || []

  await cmd.setPetnames(reject(t => t[1] === targetPubkey, petnames))
}
