import type {MyEvent} from "src/util/types"
import {sortBy, assoc, uniq, uniqBy, prop, propEq, groupBy, pluck} from "ramda"
import {personKinds, findReplyId} from "src/util/nostr"
import {chunk} from "hurdak/lib/hurdak"
import {batch, now, timedelta} from "src/util/misc"
import {
  getRelaysForEventParent,
  getAllPubkeyWriteRelays,
  aggregateScores,
  getRelaysForEventChildren,
  sampleRelays,
} from "src/agent/relays"
import {people} from "src/agent/db"
import pool from "src/agent/pool"
import sync from "src/agent/sync"

const getStalePubkeys = pubkeys => {
  // If we're not reloading, only get pubkeys we don't already know about
  return uniq(pubkeys).filter(pubkey => {
    const p = people.get(pubkey)

    return !p || p.updated_at < now() - timedelta(1, "days")
  })
}

const listen = ({relays, filter, onChunk = null, shouldProcess = true, delay = 500}) => {
  return pool.subscribe({
    filter,
    relays,
    onEvent: batch(delay, chunk => {
      if (shouldProcess) {
        sync.processEvents(chunk)
      }

      if (onChunk) {
        onChunk(chunk)
      }
    }),
  })
}

const load = ({relays, filter, onChunk = null, shouldProcess = true, timeout = 5000}) => {
  return new Promise(resolve => {
    let completed = false
    const done = new Set()
    const allEvents = []

    const attemptToComplete = async force => {
      const sub = await subPromise

      // If we've already unsubscribed we're good
      if (completed) {
        return
      }

      const isDone = done.size === relays.length

      if (force) {
        relays.forEach(relay => {
          if (!done.has(relay.url)) {
            pool.Meta.onTimeout(relay.url)
          }
        })
      }

      if (isDone || force) {
        sub.unsub()
        resolve(allEvents)
        completed = true
      }
    }

    // If a relay takes too long, give up
    setTimeout(() => attemptToComplete(true), timeout)

    const subPromise = pool.subscribe({
      relays,
      filter,
      onEvent: batch(500, chunk => {
        if (shouldProcess) {
          sync.processEvents(chunk)
        }

        if (onChunk) {
          onChunk(chunk)
        }

        for (const event of chunk) {
          allEvents.push(event)
        }
      }),
      onEose: url => {
        done.add(url)
        attemptToComplete(false)
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

const loadParents = (notes, opts = {}) => {
  const notesWithParent = notes.filter(findReplyId)

  if (notesWithParent.length === 0) {
    return []
  }

  return load({
    relays: sampleRelays(aggregateScores(notesWithParent.map(getRelaysForEventParent)), 0.3),
    filter: {kinds: [1], ids: notesWithParent.map(findReplyId)},
    ...opts,
  })
}

const streamContext = ({notes, onChunk, maxDepth = 2}) => {
  const subs = []
  const seen = new Set()
  const relays = sampleRelays(aggregateScores(notes.map(getRelaysForEventChildren)))

  const loadChunk = (events, depth) => {
    // Remove anything from the chunk we've already seen
    events = events.filter(e => e.kind === 1 && !seen.has(e.id))

    // If we have no new information, no need to re-subscribe
    if (events.length === 0) {
      return
    }

    // Add our new events to the list of stuff we've seen
    events.forEach(e => seen.add(e.id))

    // Unsubscribe our current listeners since we're about to replace them
    subs.map(sub => sub.then(s => s.unsub()))

    // Add a subscription for each chunk to listen for new likes/replies/zaps
    chunk(256, Array.from(seen)).forEach(ids => {
      subs.push(
        listen({
          relays,
          filter: [{kinds: [1, 7, 9735], "#e": ids, since: now()}],
          onChunk: newEvents => {
            onChunk(newEvents)

            if (depth < maxDepth) {
              loadChunk(newEvents, depth + 1)
            }
          },
        })
      )
    })

    const newIds = pluck("id", events)
    const pubkeys = pluck("pubkey", events)

    // Load any people we should know about
    loadPeople(pubkeys)

    // Load data prior to now for our new ids
    chunk(256, newIds).forEach(ids => {
      load({
        relays,
        filter: [{kinds: [1, 7, 9735], "#e": ids}],
        onChunk: newEvents => {
          onChunk(newEvents)

          if (depth < maxDepth) {
            loadChunk(newEvents, depth + 1)
          }
        },
      })
    })
  }

  // Kick things off by loading our first chunk
  loadChunk(notes, 1)

  return {
    unsub: () => {
      subs.map(sub => sub.then(s => s.unsub()))
    },
  }
}

const applyContext = (notes, context) => {
  context = context.map(assoc("isContext", true))

  const replies = context.filter(propEq("kind", 1))
  const reactions = context.filter(propEq("kind", 7))
  const zaps = context.filter(propEq("kind", 9735))

  const repliesByParentId = groupBy(findReplyId, replies)
  const reactionsByParentId = groupBy(findReplyId, reactions)
  const zapsByParentId = groupBy(findReplyId, zaps)

  const annotate = ({replies = [], reactions = [], zaps = [], ...note}) => {
    const combinedReplies = replies.concat(repliesByParentId[note.id] || [])
    const combinedReactions = reactions.concat(reactionsByParentId[note.id] || [])
    const combinedZaps = zaps.concat(zapsByParentId[note.id] || [])

    return {
      ...note,
      replies: sortBy(e => -e.created_at, uniqBy(prop("id"), combinedReplies).map(annotate)),
      reactions: uniqBy(prop("id"), combinedReactions),
      zaps: uniqBy(prop("id"), combinedZaps),
    }
  }

  return notes.map(annotate)
}

export default {
  load,
  listen,
  loadPeople,
  loadParents,
  streamContext,
  applyContext,
}
