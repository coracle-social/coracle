import {max, find, pluck, propEq, partition, uniq} from 'ramda'
import {derived} from 'svelte/store'
import {createMap} from 'hurdak/lib/hurdak'
import {synced, now, timedelta} from 'src/util/misc'
import {Tags, isAlert, asDisplayEvent, findReplyId} from 'src/util/nostr'
import {getUserReadRelays} from 'src/agent/relays'
import database from 'src/agent/database'
import network from 'src/agent/network'

let listener

// State

const seenAlertIds = synced('app/alerts/seenAlertIds', [])

export const lastChecked = synced('app/alerts/lastChecked', {})

export const newAlerts = derived(
  [database.watch('alerts', t => pluck('created_at', t.all()).reduce(max, 0)), lastChecked],
  ([$lastAlert, $lastChecked]) => $lastAlert > $lastChecked.alerts
)

export const newDirectMessages = derived(
  [database.watch('contacts', t => t.all()), lastChecked],
  ([contacts, $lastChecked]) =>
    Boolean(find(c => c.lastMessage > $lastChecked[c.pubkey], contacts))
)

export const newChatMessages = derived(
  [database.watch('rooms', t => t.all()), lastChecked],
  ([rooms, $lastChecked]) =>
    Boolean(find(c => c.lastMessage > $lastChecked[c.pubkey], rooms))
)

// Synchronization from events to state

const processAlerts = async (pubkey, events) => {
  // Keep track of alerts we've seen so we don't keep fetching parents repeatedly
  seenAlertIds.update($seenAlertIds => {
    const seen = new Set($seenAlertIds)

    events = events.filter(e => isAlert(e, pubkey) && !seen.has(e.id))

    events.forEach(e => $seenAlertIds.push(e.id))

    return $seenAlertIds
  })

  if (events.length === 0) {
    return
  }

  const parents = createMap('id', await network.loadParents(events))

  const asAlert = e =>
    asDisplayEvent({...e, repliesFrom: [], likedBy: [], isMention: false})

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

    database.alerts.put({...note, repliesFrom: uniq(note.repliesFrom.concat(e.pubkey))})
  })

  mentions.forEach(e => {
    const note = database.alerts.get(e.id) || asAlert(e)

    database.alerts.put({...note, isMention: true})
  })
}

const processMessages = async (pubkey, events) => {
  const messages = events.filter(propEq('kind', 4))

  if (messages.length === 0) {
    return
  }

  lastChecked.update($lastChecked => {
    for (const message of messages) {
      if (message.pubkey === pubkey) {
        const recipient = Tags.from(message).type("p").values().first()

        $lastChecked[recipient] = Math.max($lastChecked[recipient] || 0, message.created_at)
        database.contacts.patch({pubkey: recipient, accepted: true})
      } else {
        const contact = database.contacts.get(message.pubkey)
        const lastMessage = Math.max(contact?.lastMessage || 0, message.created_at)

        database.contacts.patch({pubkey: message.pubkey, lastMessage})
      }
    }

    return $lastChecked
  })
}

const processChats = async (pubkey, events) => {
  const messages = events.filter(propEq('kind', 42))

  if (messages.length === 0) {
    return
  }

  lastChecked.update($lastChecked => {
    for (const message of messages) {
      const id = Tags.from(message).type("e").values().first()

      if (message.pubkey === pubkey) {
        $lastChecked[id] = Math.max($lastChecked[id] || 0, message.created_at)
      } else {
        const room = database.rooms.get(id)
        const lastMessage = Math.max(room?.lastMessage || 0, message.created_at)

        database.rooms.patch({id, lastMessage})
      }
    }

    return $lastChecked
  })
}

const listen = async pubkey => {
  // Include an offset so we don't miss alerts on one relay but not another
  const since = now() - timedelta(30, 'days')
  const roomIds = pluck('id', database.rooms.all({joined: true}))

  if (listener) {
    listener.unsub()
  }

  listener = await network.listen({
    relays: getUserReadRelays(),
    filter: [
      {kinds: [4], authors: [pubkey], since},
      {kinds: [1, 7, 4], '#p': [pubkey], since},
      {kinds: [42], '#e': roomIds, since},
    ],
    onChunk: async events => {
      await network.loadPeople(pluck('pubkey', events))
      await processMessages(pubkey, events)
      await processAlerts(pubkey, events)
      await processChats(pubkey, events)
    },
  })
}

export default {listen}
