import {get} from 'svelte/store'
import {synced, batch, now} from 'src/util/misc'
import {isAlert} from 'src/util/nostr'
import {load as _load, listen as _listen, getMuffle, db} from 'src/agent'
import loaders from 'src/app/loaders'
import {threadify} from 'src/app'

let listener

const mostRecentAlert = synced("app/alerts/mostRecentAlert", 0)
const lastCheckedAlerts = synced("app/alerts/lastCheckedAlerts", 0)

const onChunk = async (relays, pubkey, events) => {
  events = events.filter(e => isAlert(e, pubkey))

  if (events.length > 0) {
    const context = await loaders.loadContext(relays, events)
    const notes = threadify(events, context, {muffle: getMuffle()})

    await db.alerts.bulkPut(notes)

    mostRecentAlert.update($t => events.reduce((t, e) => Math.max(t, e.created_at), $t))
  }
}

const load = async (relays, pubkey) => {
  const since = get(lastCheckedAlerts)
  const events = await _load(relays, {kinds: [1, 7], '#p': [pubkey], since, limit: 100})

  onChunk(relays, pubkey, events)
}

const listen = async (relays, pubkey) => {
  if (listener) {
    listener.unsub()
  }

  listener = await _listen(
    relays,
    {kinds: [1, 7], '#p': [pubkey], since: now()},
    batch(300, events => {
      onChunk(relays, pubkey, events)
    })
  )
}

export default {load, listen, mostRecentAlert, lastCheckedAlerts}
