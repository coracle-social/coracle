import {
  max,
  without,
  mergeLeft,
  fromPairs,
  sortBy,
  assoc,
  uniq,
  uniqBy,
  prop,
  propEq,
  groupBy,
  pluck,
} from "ramda"
import {personKinds, appDataKeys, findReplyId} from "src/util/nostr"
import {chunk, ensurePlural} from "hurdak/lib/hurdak"
import {batch, now, timedelta} from "src/util/misc"
import {ENABLE_ZAPS, user, routing, directory, network} from "src/app/system"

// If we ask for a pubkey and get nothing back, don't ask again this page load
const attemptedPubkeys = new Set()

const getStalePubkeys = pubkeys => {
  // If we're not reloading, only get pubkeys we don't already know about
  return uniq(pubkeys).filter(pubkey => {
    if (attemptedPubkeys.has(pubkey)) {
      return false
    }

    attemptedPubkeys.add(pubkey)

    const profile = directory.profiles.get(pubkey)

    return !profile || profile.updated_at < now() - timedelta(1, "days")
  })
}

class Cursor {
  relays: string[]
  limit: number
  delta?: number
  until: Record<string, number>
  since: number
  seen: Set<string>
  constructor({relays, limit = 20, delta = undefined, until = now()}) {
    this.relays = relays
    this.limit = limit
    this.delta = delta
    this.until = fromPairs(relays.map(url => [url, until]))
    this.since = 0
    this.seen = new Set()
  }
  async loadPage({filter, onChunk}) {
    // Undo and redo batching so it works across multiple calls to load
    const onEvent = batch(500, onChunk)
    const untilCopy = {...this.until}

    if (this.delta) {
      this.since = Object.values(this.until).reduce(max, 0) - this.delta
    }

    await Promise.all(
      this.getGroupedRelays()
        .filter(([until]) => until > this.since)
        .map(([until, relays]) =>
          network.load({
            relays: relays,
            filter: ensurePlural(filter).map(
              mergeLeft({until, limit: this.limit, since: this.since})
            ),
            onEvent: batch(500, events => {
              for (const event of events) {
                for (const url of event.seen_on) {
                  if (event.created_at < this.until[url]) {
                    this.until[url] = event.created_at
                  }
                }

                if (this.seen.has(event.id)) {
                  continue
                }

                this.seen.add(event.id)

                onEvent(event)
              }
            }),
          })
        )
    )

    // If we got zero results for any relays, they have nothing for the given window,
    // back until up to since for next time, but only for relays currently in the window
    if (this.delta) {
      this.relays.forEach(url => {
        if (this.until[url] > this.since && untilCopy[url] === this.until[url]) {
          this.until[url] -= this.delta
        }
      })
    }
  }
  getGroupedRelays() {
    // Group relays by rounded clusters to get some benefit out of
    // multiplextr despite paginating per-relay
    const threshold = timedelta(5, "minutes")
    const untils = this.relays.map(url => this.until[url])

    for (let i = 0; i < untils.length; i++) {
      for (let j = i + 1; j < untils.length; j++) {
        if (Math.abs(untils[j] - untils[i]) > threshold) {
          continue
        }

        // Take the later timestamp so we don't miss anything
        if (untils[i] > untils[j]) {
          untils[j] = untils[i]
        } else {
          untils[i] = untils[j]
        }
      }
    }

    const relaysByUntil = new Map()

    for (let i = 0; i < untils.length; i++) {
      const until = untils[i]
      const relay = this.relays[i]

      if (!relaysByUntil.has(until)) {
        relaysByUntil.set(until, [])
      }

      relaysByUntil.get(until).push(relay)
    }

    return Array.from(relaysByUntil.entries())
  }
}

const loadPeople = async (
  pubkeys,
  {
    relays = null,
    kinds = personKinds,
    force = false,
  }: {relays?: string[]; kinds?: number[]; force?: boolean} = {}
) => {
  pubkeys = uniq(pubkeys)

  // If we're not reloading, only get pubkeys we don't already know about
  if (!force) {
    pubkeys = getStalePubkeys(pubkeys)
  }

  await Promise.all(
    chunk(256, pubkeys).map(async chunk => {
      const chunkRelays =
        relays?.length > 0
          ? relays
          : routing.mergeHints(
              user.getSetting("relay_limit"),
              chunk.map(pubkey => routing.getPubkeyHints(3, pubkey))
            )

      const chunkFilter = [] as Array<Record<string, any>>

      chunkFilter.push({kinds: without([30078], kinds), authors: chunk})

      // Add a separate filter for app data so we're not pulling down other people's stuff,
      // or obsolete events of our own.
      if (kinds.includes(30078)) {
        chunkFilter.push({kinds: [30078], authors: chunk, "#d": appDataKeys})
      }

      await network.load({relays: chunkRelays, filter: chunkFilter})
    })
  )
}

const streamContext = ({notes, onChunk, maxDepth = 2}) => {
  const seen = new Set()
  const kinds = ENABLE_ZAPS ? [1, 7, 9735] : [1, 7]
  const relays = routing.mergeHints(
    user.getSetting("relay_limit"),
    notes.map(e => routing.getReplyHints(3, e))
  )

  const loadChunk = (events, depth) => {
    // Remove anything from the chunk we've already seen
    events = events.filter(e => ![7, 9735].includes(e.kind) && !seen.has(e.id))

    // If we have no new information, no need to re-subscribe
    if (events.length === 0) {
      return
    }

    const subs = []

    // Add our new events to the list of stuff we've seen
    events.forEach(e => seen.add(e.id))

    // Unsubscribe our current listeners since we're about to replace them
    subs.map(unsubscribe => unsubscribe())

    // Add a subscription for each chunk to listen for new likes/replies/zaps
    chunk(256, Array.from(seen)).forEach(ids => {
      subs.push(
        network.subscribe({
          relays,
          filter: [{kinds, "#e": ids, since: now()}],
          onEvent: batch(500, newEvents => {
            onChunk(newEvents)

            if (depth < maxDepth) {
              loadChunk(newEvents, depth + 1)
            }
          }),
        })
      )
    })

    const newIds = pluck("id", events)
    const pubkeys = pluck("pubkey", events)

    // Load any people we should know about
    loadPeople(pubkeys)

    // Load data prior to now for our new ids
    chunk(256, newIds).forEach(ids => {
      network.load({
        relays,
        filter: [{kinds, "#e": ids}],
        onEvent: batch(500, newEvents => {
          onChunk(newEvents)

          if (depth < maxDepth) {
            loadChunk(newEvents, depth + 1)
          }
        }),
      })
    })
  }

  // Kick things off by loading our first chunk
  loadChunk(notes, 1)
}

const applyContext = (notes, context) => {
  context = context.map(assoc("isContext", true))

  const replies = context.filter(e => ![7, 9735].includes(e.kind))
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
  Cursor,
  loadPeople,
  streamContext,
  applyContext,
}
