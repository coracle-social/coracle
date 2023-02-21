import {get} from 'svelte/store'
import {uniq, partition, propEq} from 'ramda'
import {createMap} from 'hurdak/lib/hurdak'
import {synced, timedelta, now} from 'src/util/misc'
import {isAlert, findReplyId} from 'src/util/nostr'
import database from 'src/agent/database'
import network from 'src/agent/network'
import {getUserReadRelays} from 'src/agent/relays'

let listener

const mostRecentAlert = synced("app/alerts/mostRecentAlert", 0)
const lastCheckedAlerts = synced("app/alerts/lastCheckedAlerts", 0)

const asAlert = e => ({...e, replies: [], likedBy: [], isMention: false})

const onChunk = async (pubkey, events) => {
  events = events.filter(e => isAlert(e, pubkey))

  const parents = createMap('id', await network.loadParents(events))

  const isPubkeyChild = e => {
    const parentId = findReplyId(e)

    return parents[parentId]?.pubkey === pubkey
  }

  const [likes, notes] = partition(propEq('kind', 7), events)
  const [replies, mentions] = partition(isPubkeyChild, notes)

  likes.filter(isPubkeyChild).forEach(e => {
    const parent = parents[findReplyId(e)]
    const note = database.alerts.get(parent.id) || asAlert(parent)

    database.alerts.put({...note, likedBy: uniq(note.likedBy.concat(e.pubkey))})
  })

  replies.forEach(e => {
    const parent = parents[findReplyId(e)]
    const note = database.alerts.get(parent.id) || asAlert(parent)

    database.alerts.put({...note, replies: uniq(note.replies.concat(e.pubkey))})
  })

  mentions.forEach(e => {
    const note = database.alerts.get(e.id) || asAlert(e)

    database.alerts.put({...note, isMention: true})
  })

  mostRecentAlert.update($t => events.reduce((t, e) => Math.max(t, e.created_at), $t))
}

const load = pubkey => {
  // Include an offset so we don't miss alerts on one relay but not another
  const since = get(mostRecentAlert) - timedelta(30, 'days')

  // Crank the threshold up since we can afford for this to be slow
  network.load({
    relays: getUserReadRelays(),
    filter: {kinds: [1, 7], '#p': [pubkey], since, limit: 1000},
    onChunk: events => onChunk(pubkey, events)
  })
}

const listen = async pubkey => {
  if (listener) {
    listener.unsub()
  }

  listener = await network.listen({
    relays: getUserReadRelays(),
    filter: {kinds: [1, 7], '#p': [pubkey], since: now()},
    onChunk: events => onChunk(pubkey, events)
  })
}

export default {load, listen, mostRecentAlert, lastCheckedAlerts}
