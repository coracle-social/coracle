import Dexie from 'dexie'
import {writable} from 'svelte/store'
import {groupBy, prop, flatten, pick} from 'ramda'
import {ensurePlural, switcherFn} from 'hurdak/lib/hurdak'
import {now, getLocalJson, setLocalJson} from 'src/util/misc'
import {filterTags, findReply, findRoot} from 'src/util/nostr'

export const db = new Dexie('coracle/relay')

db.version(4).stores({
  relays: '++url, name',
  events: '++id, pubkey, created_at, kind, content, reply, root',
  tags: '++key, event, value',
})

window.db = db

// Some things work better as observables than database tables

db.user = writable(getLocalJson("db/user"))
db.people = writable(getLocalJson('db.people') || {})
db.network = writable(getLocalJson('db/network') || [])
db.connections = writable(getLocalJson("db/connections") || [])

db.user.subscribe($user => setLocalJson("coracle/user", $user))
db.people.subscribe($people => setLocalJson("coracle/people", $people))
db.network.subscribe($network => setLocalJson("coracle/network", $network))
db.connections.subscribe($connections => setLocalJson("coracle/connections", $connections))

// Hooks

db.events.process = async events => {
  // Only persist ones we care about, the rest can be
  // ephemeral and used to update people etc
  const eventsByKind = groupBy(prop('kind'), ensurePlural(events))
  const notesAndReactions = flatten(Object.values(pick([1, 7], eventsByKind)))
  const profileUpdates = flatten(Object.values(pick([0, 3, 12165], eventsByKind)))
  const deletions = eventsByKind[5] || []

  // Persist notes and reactions
  if (notesAndReactions.length > 0) {
    const persistentEvents = notesAndReactions
      .map(e => ({...e, root: findRoot(e), reply: findReply(e)}))

    db.events.bulkPut(persistentEvents)

    db.tags.bulkPut(
      persistentEvents
        .flatMap(e =>
          e.tags.map(
            tag => ({
              id: [e.id, ...tag.slice(0, 2)].join(':'),
              event: e.id,
              type: tag[0],
              value: tag[1],
              relay: tag[2],
              mark: tag[3],
            })
          )
        )
    )
  }

  // Delete stuff that needs to be deleted
  if (deletions.length > 0) {
    const eventIds = deletions.flatMap(e => filterTags({tag: "e"}, e))

    db.events.where('id').anyOf(eventIds).delete()
    db.tags.where('event').anyOf(eventIds).delete()
  }

  // Update our people
  db.people.update($people => {
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
        3: () => putPerson({petnames: tags}),
        12165: () => putPerson({muffle: tags}),
        default: () => {
          console.log(`Received unsupported event type ${event.kind}`)
        },
      })
    }

    return $people
  })
}
