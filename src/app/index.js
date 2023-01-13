import {without} from 'ramda'
import {get} from 'svelte/store'
import {getPerson, getRelays, load, keys} from 'src/agent'
import {toast, modal, settings} from 'src/app/ui'
import cmd from 'src/app/cmd'
import alerts from 'src/app/alerts'
import loaders from 'src/app/loaders'
import query from 'src/app/query'

export {toast, modal, settings, alerts}

export const login = async ({privkey, pubkey}) => {
  if (privkey) {
    keys.setPrivateKey(privkey)
  } else {
    keys.setPublicKey(pubkey)
  }

  await Promise.all([
    loaders.loadNetwork(getRelays(), pubkey),
    alerts.load(getRelays(), pubkey),
    alerts.listen(getRelays(), pubkey),
  ])
}

export const addRelay = async url => {
  const pubkey = get(keys.pubkey)
  const person = getPerson(pubkey)
  const relays = (person?.relays || []).concat(url)

  await cmd.setRelays(relays)

  await Promise.all([
    loaders.loadNetwork(getRelays(), pubkey),
    alerts.load(getRelays(), pubkey),
    alerts.listen(getRelays(), pubkey),
  ])
}

export const removeRelay = async url => {
  const pubkey = get(keys.pubkey)
  const person = getPerson(pubkey)
  const relays = person?.relays || []

  await cmd.setRelays(without([url], relays))
}

export const loadNote = async (relays, id) => {
  const [found] = await load(relays, {ids: [id]})

  if (!found) {
    return null
  }

  const context = await loaders.loadContext(relays, found)
  const note = query.annotate(found, context, {showEntire: true, depth: 3})

  // Log this for debugging purposes
  console.log('loadNote', note)

  return note
}
