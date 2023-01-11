import Dexie from 'dexie'
import {ensurePlural, switcherFn} from 'hurdak/lib/hurdak'
import {synced, now, timedelta} from 'src/util/misc'
import {personKinds} from 'src/util/nostr'

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
  const profileUpdates = ensurePlural(events)
    .filter(e => personKinds.includes(e.kind))

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
        10001: () => putPerson({relays: tags.map(t => t[0])}),
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
