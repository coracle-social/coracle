import Dexie from 'dexie'
import {matchFilter} from 'nostr-tools'
import {writable, get} from 'svelte/store'
import {groupBy, prop, flatten, pick} from 'ramda'
import {ensurePlural, switcherFn} from 'hurdak/lib/hurdak'
import {synced, now, timedelta} from 'src/util/misc'
import {filterTags, personKinds, findReply, findRoot} from 'src/util/nostr'
import keys from 'src/agent/keys'

export const db = new Dexie('agent/data/db')

db.version(7).stores({
  relays: '++url, name',
  events: '++id, pubkey, created_at, loaded_at, kind, content, reply, root',
  tags: '++key, event, value, created_at, loaded_at',
  alerts: '++id',
})

// Some things work better as observables than database tables

export const people = synced('agent/data/people', {})

let $people = {}
people.subscribe($p => {
  $people = $p
})

export const getPerson = (pubkey, fallback = false) =>
  $people[pubkey] || (fallback ? {pubkey} : null)

// Hooks

export const processEvents = async events => {
  // Only persist ones we care about, the rest can be ephemeral and used to update people etc
  const pubkey = get(keys.pubkey)
  const eventsByKind = groupBy(prop('kind'), ensurePlural(events))
  const notesAndReactions = flatten(Object.values(pick([1, 7], eventsByKind)))
    .map(e => ({...e, root: findRoot(e), reply: findReply(e), loaded_at: now()}))
  const alerts = notesAndReactions.filter(e => matchFilter({kinds: [1, 7], '#p': [pubkey]}, e))
  const profileUpdates = flatten(Object.values(pick(personKinds, eventsByKind)))
  const deletions = eventsByKind[5] || []

  // Persist notes and reactions
  if (notesAndReactions.length > 0) {
    db.events.bulkPut(notesAndReactions)

    db.tags.bulkPut(
      notesAndReactions
        .flatMap(e =>
          e.tags.map(
            tag => ({
              id: [e.id, ...tag.slice(0, 2)].join(':'),
              event: e.id,
              type: tag[0],
              value: tag[1],
              relay: tag[2],
              mark: tag[3],
              loaded_at: now(),
            })
          )
        )
    )
  }

  if (alerts.length > 0) {
    db.alerts.bulkPut(alerts)
  }

  // Delete stuff that needs to be deleted
  if (deletions.length > 0) {
    const eventIds = deletions.flatMap(e => filterTags({tag: "e"}, e))

    db.events.where('id').anyOf(eventIds).delete()
    db.tags.where('event').anyOf(eventIds).delete()
  }

  // Update our people
  people.update($people => {
    for (const event of profileUpdates) {
      const {pubkey, kind, content, tags} = event
      const putPerson = data => {
        $people[pubkey] = {
          ...$people[pubkey],
          ...data,
          pubkey,
          updated_at: now(),
        }
      }

      switcherFn(kind, {
        0: () => putPerson(JSON.parse(content)),
        2: () => putPerson({relays: ($people[pubkey]?.relays || []).concat(content)}),
        3: () => putPerson({petnames: tags}),
        12165: () => putPerson({muffle: tags}),
        10001: () => putPerson({relays: tags}),
        default: () => {
          console.log(`Received unsupported event type ${event.kind}`)
        },
      })
    }

    return $people
  })
}

// Periodicallly delete old event data
(function cleanup() {
  const threshold = now() - timedelta(1, 'hours')

  db.events.where('loaded_at').below(threshold).delete()
  db.tags.where('loaded_at').below(threshold).delete()

  setTimeout(cleanup, timedelta(15, 'minutes'))
})()
