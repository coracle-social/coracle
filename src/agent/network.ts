import type {MyEvent} from 'src/util/types'
import {uniq, uniqBy, prop, map, propEq, without, indexBy, pluck} from 'ramda'
import {personKinds, findReplyId} from 'src/util/nostr'
import {log} from 'src/util/logger'
import {chunk} from 'hurdak/lib/hurdak'
import {batch, timedelta, now} from 'src/util/misc'
import {
  getRelaysForEventParent, getAllPubkeyWriteRelays, aggregateScores,
  getRelaysForEventChildren, sampleRelays, normalizeRelays,
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

const listen = ({relays, filter, onChunk, shouldProcess = true}) => {
  relays = normalizeRelays(relays)

  return pool.subscribe({
    filter,
    relays,
    onEvent: batch(300, events => {
      if (shouldProcess) {
        sync.processEvents(events)
      }

      if (onChunk) {
        onChunk(events)
      }
    }),
  })
}

const load = ({relays, filter, onChunk = null, shouldProcess = true, timeout = 10_000}) => {
  return new Promise(resolve => {
    relays = normalizeRelays(relays)

    const now = Date.now()
    const done = new Set()
    const events = []

    const attemptToComplete = async () => {
      const sub = await subPromise

      // If we've already unsubscribed we're good
      if (!sub.isActive()) {
        return
      }

      const isDone = done.size === relays.length
      const isTimeout = Date.now() - now >= timeout

      if (isTimeout) {
        const timedOutRelays = without(Array.from(done), relays)

        log(`Timing out ${timedOutRelays.length} relays after ${timeout}ms`, timedOutRelays)

        timedOutRelays.forEach(url => {
          const conn = pool.getConnection(url)

          if (conn) {
            conn.stats.timeouts += 1
          }
        })
      }

      if (isDone || isTimeout) {
        sub.unsub()
        resolve(events)
      }
    }

    // If a relay takes too long, give up
    setTimeout(attemptToComplete, timeout)

    const subPromise = pool.subscribe({
      relays,
      filter,
      onEvent: batch(300, event => {
        if (shouldProcess) {
          sync.processEvents(events)
        }

        if (onChunk) {
          onChunk(events)
        }

        events.push(event)
      }),
      onEose: url => {
        done.add(url)
        attemptToComplete()
      },
      onError: url => {
        done.add(url)
        attemptToComplete()
      },
    })
  }) as Promise<MyEvent[]>
}

const loadPeople = async (pubkeys, {relays = null, kinds = personKinds, force = false} = {}) => {
  pubkeys = uniq(pubkeys)

  // If we're not reloading, only get pubkeys we don't already know about
  if (!force) {
    pubkeys = getStalePubkeys(pubkeys)
  }

  await Promise.all(
    chunk(256, pubkeys).map(async chunk => {
      await load({
        relays: sampleRelays(relays || getAllPubkeyWriteRelays(chunk), 0.5),
        filter: {kinds, authors: chunk},
      })
    })
  )
}

const loadParents = notes => {
  const notesWithParent = notes.filter(findReplyId)

  return load({
    relays: sampleRelays(aggregateScores(notesWithParent.map(getRelaysForEventParent)), 0.3),
    filter: {kinds: [1], ids: notesWithParent.map(findReplyId)}
  })
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
    load({
      relays,
      filter,
      onChunk: events => {
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
      },
    })
  })
}

export default {
  publish, listen, load, loadPeople, personKinds, loadParents, streamContext,
}

