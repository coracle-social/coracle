import {uniq, uniqBy, prop, map, propEq, indexBy, pluck} from 'ramda'
import {personKinds, findReplyId} from 'src/util/nostr'
import {chunk} from 'hurdak/lib/hurdak'
import {batch, timedelta, now} from 'src/util/misc'
import {
  getRelaysForEventParent, getAllPubkeyWriteRelays, aggregateScores,
  getRelaysForEventChildren, sampleRelays,
} from 'src/agent/relays'
import database from 'src/agent/database'
import pool from 'src/agent/pool'
import keys from 'src/agent/keys'
import sync from 'src/agent/sync'

const getStalePubkeys = pubkeys => {
  // If we're not reloading, only get pubkeys we don't already know about
  return uniq(pubkeys).filter(pubkey => {
    const p = database.people.get(pubkey)

    return !p || p.updated_at < now() - timedelta(1, 'days')
  })
}

const publish = async (relays, event) => {
  const signedEvent = await keys.sign(event)

  await Promise.all([
    pool.publish(relays, signedEvent),
    sync.processEvents(signedEvent),
  ])

  return signedEvent
}

const load = async (relays, filter, opts?): Promise<Record<string, unknown>[]> => {
  const events = await pool.request(sampleRelays(relays), filter, opts)

  await sync.processEvents(events)

  return events
}

const listen = (relays, filter, onEvents, {shouldProcess = true}: any = {}) => {
  return pool.subscribe(sampleRelays(relays), filter, {
    onEvent: batch(300, events => {
      if (shouldProcess) {
        sync.processEvents(events)
      }

      if (onEvents) {
        onEvents(events)
      }
    }),
  })
}

const listenUntilEose = (relays, filter, onEvents, {shouldProcess = true}: any = {}) => {
  return new Promise(resolve => {
    pool.subscribeUntilEose(sampleRelays(relays), filter, {
      onClose: () => resolve(),
      onEvent: batch(300, events => {
        if (shouldProcess) {
          sync.processEvents(events)
        }

        if (onEvents) {
          onEvents(events)
        }
      }),
    })
  }) as Promise<void>
}

const loadPeople = async (pubkeys, {relays = null, kinds = personKinds, force = false, ...opts} = {}) => {
  pubkeys = uniq(pubkeys)

  // If we're not reloading, only get pubkeys we don't already know about
  if (!force) {
    pubkeys = getStalePubkeys(pubkeys)
  }

  await Promise.all(
    chunk(256, pubkeys).map(async chunk => {
      await load(
        sampleRelays(relays || getAllPubkeyWriteRelays(chunk), 0.5),
        {kinds, authors: chunk},
        opts
      )
    })
  )
}

const loadParents = notes => {
  const notesWithParent = notes.filter(findReplyId)

  return load(
    sampleRelays(aggregateScores(notesWithParent.map(getRelaysForEventParent)), 0.3),
    {kinds: [1], ids: notesWithParent.map(findReplyId)}
  )
}

const streamContext = ({notes, updateNotes, depth = 0}) => {
  // Some relays reject very large filters, send multiple subscriptions
  chunk(256, notes).forEach(chunk => {
    const authors = getStalePubkeys(pluck('pubkey', chunk))
    const filter = [{kinds: [1, 7], '#e': pluck('id', chunk)}] as Array<object>
    const relays = sampleRelays(aggregateScores(chunk.map(getRelaysForEventChildren)))

    if (authors.length > 0) {
      filter.push({kinds: personKinds, authors})
    }

    // Load authors and reactions in one subscription
    listenUntilEose(relays, filter, events => {
      const repliesByParentId = indexBy(findReplyId, events.filter(propEq('kind', 1)))
      const reactionsByParentId = indexBy(findReplyId, events.filter(propEq('kind', 7)))

      // Recur if we need to
      if (depth > 0) {
        streamContext({notes: events, updateNotes, depth: depth - 1})
      }

      const annotate = ({replies = [], reactions = [], children = [], ...note}) => {
        if (depth > 0) {
          children = uniqBy(prop('id'), children.concat(replies))
        }

        return {
          ...note,
          replies: uniqBy(prop('id'), replies.concat(repliesByParentId[note.id] || [])),
          reactions: uniqBy(prop('id'), reactions.concat(reactionsByParentId[note.id] || [])),
          children: children.map(annotate),
        }
      }

      updateNotes(map(annotate))
    })
  })
}

export default {
  publish, load, listen, listenUntilEose, loadPeople, personKinds,
  loadParents, streamContext,
}

