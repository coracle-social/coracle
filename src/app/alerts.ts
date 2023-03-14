import type {DisplayEvent} from 'src/util/types'
import {max, find, pluck, propEq, partition, uniq} from 'ramda'
import {derived} from 'svelte/store'
import {createMap} from 'hurdak/lib/hurdak'
import {synced, tryJson, now, timedelta} from 'src/util/misc'
import {Tags, personKinds, isAlert, asDisplayEvent, findReplyId} from 'src/util/nostr'
import {getUserReadRelays} from 'src/agent/relays'
import {alerts, contacts, rooms} from 'src/agent/state'
import {watch} from 'src/agent/table'
import network from 'src/agent/network'

let listener

type AlertEvent = DisplayEvent & {
  zappedBy?: Array<string>
  likedBy: Array<string>
  repliesFrom: Array<string>
  isMention: boolean
}

// State

const seenAlertIds = synced('app/alerts/seenAlertIds', [])

export const lastChecked = synced('app/alerts/lastChecked', {})

export const newAlerts = derived(
  [watch('alerts', t => pluck('created_at', t.all()).reduce(max, 0)), lastChecked],
  ([$lastAlert, $lastChecked]) => $lastAlert > ($lastChecked.alerts || 0)
)

export const newDirectMessages = derived(
  [watch('contacts', t => t.all()), lastChecked],
  ([contacts, $lastChecked]) =>
    Boolean(find(c => c.lastMessage > $lastChecked[c.pubkey], contacts))
)

export const newChatMessages = derived(
  [watch('rooms', t => t.all()), lastChecked],
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

  const asAlert = (e): AlertEvent =>
    ({repliesFrom: [], likedBy: [], zappedBy: [], isMention: false, ...asDisplayEvent(e)})

  const isPubkeyChild = e => {
    const parentId = findReplyId(e)

    return parents[parentId]?.pubkey === pubkey
  }

  const [replies, mentions] = partition(isPubkeyChild, events.filter(propEq('kind', 1)))
  const likes = events.filter(propEq('kind', 7))
  const zaps = events.filter(propEq('kind', 9735))

  zaps.filter(isPubkeyChild).forEach(e => {
    const parent = parents[findReplyId(e)]
    const note = asAlert(alerts.get(parent.id) || parent)
    const meta = Tags.from(e).asMeta()
    const request = tryJson(() => JSON.parse(meta.description))

    if (request) {
      alerts.put({...note, zappedBy: uniq(note.zappedBy.concat(request.pubkey))})
    }
  })

  likes.filter(isPubkeyChild).forEach(e => {
    const parent = parents[findReplyId(e)]
    const note = asAlert(alerts.get(parent.id) || parent)

    alerts.put({...note, likedBy: uniq(note.likedBy.concat(e.pubkey))})
  })

  replies.forEach(e => {
    const parent = parents[findReplyId(e)]
    const note = asAlert(alerts.get(parent.id) || parent)

    alerts.put({...note, repliesFrom: uniq(note.repliesFrom.concat(e.pubkey))})
  })

  mentions.forEach(e => {
    const note = alerts.get(e.id) || asAlert(e)

    alerts.put({...note, isMention: true})
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
        contacts.patch({pubkey: recipient, accepted: true})
      } else {
        const contact = contacts.get(message.pubkey)
        const lastMessage = Math.max(contact?.lastMessage || 0, message.created_at)

        contacts.patch({pubkey: message.pubkey, lastMessage})
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
        const room = rooms.get(id)
        const lastMessage = Math.max(room?.lastMessage || 0, message.created_at)

        rooms.patch({id, lastMessage})
      }
    }

    return $lastChecked
  })
}

const listen = async pubkey => {
  // Include an offset so we don't miss alerts on one relay but not another
  const since = now() - timedelta(7, 'days')
  const roomIds = pluck('id', rooms.all({joined: true}))

  if (listener) {
    listener.unsub()
  }

  listener = await network.listen({
    delay: 10000,
    relays: getUserReadRelays(),
    filter: [
      {kinds: personKinds, authors: [pubkey], since},
      {kinds: [4], authors: [pubkey], since},
      {kinds: [1, 7, 4, 9735], '#p': [pubkey], since},
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
