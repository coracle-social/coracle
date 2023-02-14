import {uniq, uniqBy, prop, map, propEq, indexBy, pluck} from 'ramda'
import {findReply, personKinds, findReplyId, Tags} from 'src/util/nostr'
import {chunk} from 'hurdak/lib/hurdak'
import {batch} from 'src/util/misc'
import {getFollows, getStalePubkeys, getTopEventRelays} from 'src/agent/helpers'
import pool from 'src/agent/pool'
import keys from 'src/agent/keys'
import sync from 'src/agent/sync'

const publish = async (relays, event) => {
  const signedEvent = await keys.sign(event)

  await Promise.all([
    pool.publish(relays, signedEvent),
    sync.processEvents(signedEvent),
  ])

  return signedEvent
}

const load = async (relays, filter, opts?): Promise<Record<string, unknown>[]> => {
  const events = await pool.request(relays, filter, opts)

  await sync.processEvents(events)

  return events
}

const listen = (relays, filter, onEvents, {shouldProcess = true}: any = {}) => {
  return pool.subscribe(relays, filter, {
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
    pool.subscribeUntilEose(relays, filter, {
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

const loadPeople = (relays, pubkeys, {kinds = personKinds, force = false, ...opts} = {}) => {
  pubkeys = uniq(pubkeys)

  // If we're not reloading, only get pubkeys we don't already know about
  if (!force) {
    pubkeys = getStalePubkeys(pubkeys)
  }

  return pubkeys.length > 0
    ? load(relays, {kinds, authors: pubkeys}, opts)
    : Promise.resolve([])
}

const loadNetwork = async (relays, pubkey) => {
  const tags = Tags.wrap(getFollows(pubkey))

  // Use nip-2 recommended relays to load our user's second-order follows
  await loadPeople(tags.relays(), tags.values().all())
}

const loadParents = (relays, notes) => {
  const parentIds = new Set(Tags.wrap(notes.map(findReply)).values().all())

  if (parentIds.size === 0) {
    return []
  }

  return load(
    relays.concat(getTopEventRelays(notes, 'read')),
    {kinds: [1], ids: Array.from(parentIds)}
  )
}

const streamContext = ({relays, notes, updateNotes, depth = 0}) => {
  // Some relays reject very large filters, send multiple
  chunk(256, notes).forEach(chunk => {
    const authors = getStalePubkeys(pluck('pubkey', chunk))
    const filter = [
      {kinds: [1, 7], '#e': pluck('id', chunk)},
      {kinds: personKinds, authors},
    ]

    // Load authors and reactions in one subscription
    listenUntilEose(relays, filter, events => {
      const repliesByParentId = indexBy(findReplyId, events.filter(propEq('kind', 1)))
      const reactionsByParentId = indexBy(findReplyId, events.filter(propEq('kind', 7)))

      // Recur if we need to
      if (depth > 0) {
        streamContext({relays, notes: events, updateNotes, depth: depth - 1})
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
  publish, load, listen, listenUntilEose, loadNetwork, loadPeople, personKinds,
  loadParents, streamContext,
}

