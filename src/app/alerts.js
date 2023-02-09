import {get} from 'svelte/store'
import {groupBy, pluck, partition, propEq} from 'ramda'
import {synced, timedelta, batch, now} from 'src/util/misc'
import {isAlert, findReplyId} from 'src/util/nostr'
import {load as _load, listen as _listen, database} from 'src/agent'
import loaders from 'src/app/loaders'
import {annotate} from 'src/app'

let listener

const mostRecentAlert = synced("app/alerts/mostRecentAlert", 0)
const lastCheckedAlerts = synced("app/alerts/lastCheckedAlerts", 0)

const onChunk = async (relays, pubkey, events) => {
  events = events.filter(e => isAlert(e, pubkey))

  if (events.length > 0) {
    const context = await loaders.loadContext(relays, events)
    const [likes, notes] = partition(propEq('kind', 7), events)
    const annotatedNotes = notes.map(n => annotate(n, context))
    const likesByParent = groupBy(findReplyId, likes)
    const likedNotes = context
      .filter(e => likesByParent[e.id])
      .map(e => annotate({...e, likedBy: pluck('pubkey', likesByParent[e.id])}, context))

    await database.alerts.bulkPut(annotatedNotes.concat(likedNotes))

    mostRecentAlert.update($t => events.reduce((t, e) => Math.max(t, e.created_at), $t))
  }
}

const load = async (relays, pubkey) => {
  // Include an offset so we don't miss alerts on one relay but not another
  const since = get(mostRecentAlert) - timedelta(30, 'days')

  // Crank the threshold up since we can afford for this to be slow
  const events = await _load(
    relays,
    {kinds: [1, 7], '#p': [pubkey], since, limit: 1000},
    {threshold: 0.9}
  )

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
