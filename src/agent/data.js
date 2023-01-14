import Dexie from 'dexie'
import {writable} from 'svelte/store'
import {ensurePlural, createMap, switcherFn} from 'hurdak/lib/hurdak'
import {now} from 'src/util/misc'
import {personKinds} from 'src/util/nostr'

export const db = new Dexie('agent/data/db')

db.version(9).stores({
  relays: '++url, name',
  alerts: '++id, created_at',
  people: '++pubkey',
})

// A flag for hiding things that rely on people being loaded initially
export const ready = writable(false)

// Some things work better as observables than database tables
export const people = writable([])

// Bootstrap our people observable
db.people.toArray().then($p => {
  people.set(createMap('pubkey', $p))
  ready.set(true)
})

// Sync to a regular object so we have a synchronous interface
let $people = {}
people.subscribe($p => {
  $people = $p
})

// Our synchronous interface
export const getPerson = (pubkey, fallback = false) =>
  $people[pubkey] || (fallback ? {pubkey} : null)

export const updatePeople = async updates => {
  // Sync to our in memory copy
  people.update($people => ({...$people, ...updates}))

  // Sync to our database
  await db.people.bulkPut(Object.values(updates))
}

// Hooks

export const processEvents = async events => {
  const profileEvents = ensurePlural(events)
    .filter(e => personKinds.includes(e.kind))

  const updates = {}
  for (const e of profileEvents) {
    const person = getPerson(e.pubkey, true)

    updates[e.pubkey] = {
      ...person,
      ...updates[e.pubkey],
      ...switcherFn(e.kind, {
        0: () => JSON.parse(e.content),
        2: () => {
          if (e.created_at > person.updated_at) {
            return {
              relays: ($people[e.pubkey]?.relays || []).concat({url: e.content}),
              relays_updated_at: e.created_at,
            }
          }
        },
        3: () => ({petnames: e.tags}),
        12165: () => ({muffle: e.tags}),
        10001: () => {
          if (e.created_at > person.updated_at) {
            return {
              relays: e.tags.map(([url, read, write]) => ({url, read, write})),
              relays_updated_at: e.created_at,
            }
          }
        },
        default: () => {
          console.log(`Received unsupported event type ${event.kind}`)
        },
      }),
      updated_at: now(),
    }
  }

  await updatePeople(updates)
}
