import {without} from 'ramda'
import {updateIn, mergeRight} from 'hurdak/lib/hurdak'
import {get} from 'svelte/store'
import {getPerson, getRelays, people, keys, db} from 'src/agent'
import {toast, modal, settings} from 'src/app/ui'
import cmd from 'src/app/cmd'
import alerts from 'src/app/alerts'
import loaders from 'src/app/loaders'

export {toast, modal, settings, alerts}

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

  await Promise.all([
    db.tags.clear(),
    db.events.clear(),
  ])
}

export const addRelay = async url => {
  const pubkey = get(keys.pubkey)
  const person = getPerson(pubkey)
  const relays = (person?.relays || []).concat(url)

  // Persist to our local copy immediately so we can publish to the new one
  people.update(updateIn(pubkey, mergeRight({pubkey, relays})))

  await cmd.setRelays(relays)
  await loaders.loadNetwork(relays, pubkey)
  await alerts.listen(relays, pubkey)
}

export const removeRelay = async url => {
  const pubkey = get(keys.pubkey)
  const person = getPerson(pubkey)
  const relays = person?.relays || []

  await cmd.setRelays(without([url], relays))
}
