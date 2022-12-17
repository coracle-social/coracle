import Dexie from 'dexie'
import {groupBy, prop, flatten, pick} from 'ramda'
import {ensurePlural, switcherFn} from 'hurdak/lib/hurdak'
import {now} from 'src/util/misc'
import {filterTags, findReply, findRoot} from 'src/util/nostr'

export const db = new Dexie('coracle/relay')

db.version(4).stores({
  relays: '++url, name',
  events: '++id, pubkey, created_at, kind, content, reply, root',
  people: '++pubkey, name, about',
  tags: '++key, event, value',
})

window.db = db

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
  for (const event of profileUpdates) {
    const {pubkey, kind, content, tags} = event
    const person = await db.people.where('pubkey').equals(pubkey).first()
    const putPerson = data => db.people.put({...person, ...data, pubkey, updated_at: now()})

    await switcherFn(kind, {
      0: () => putPerson(JSON.parse(content)),
      3: () => putPerson({petnames: tags}),
      12165: () => putPerson({muffle: tags}),
      default: () => {
        console.log(`Received unsupported event type ${event.kind}`)
      },
    })
  }
}
