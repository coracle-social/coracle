import Dexie, {liveQuery} from 'dexie'
import {pick} from 'ramda'
import {nip05} from 'nostr-tools'
import {writable} from 'svelte/store'
import {noop, ensurePlural, createMap, switcherFn} from 'hurdak/lib/hurdak'
import {now} from 'src/util/misc'
import {personKinds, Tags, roomAttrs, isRelay} from 'src/util/nostr'

export const lq = cb => liveQuery(async () => {
  try {
    return await cb()
  } catch (e) {
    console.error(e)
  }
})

export const db = new Dexie('agent/data/db')

db.version(13).stores({
  relays: '++url, name',
  alerts: '++id, created_at',
  messages: '++id, pubkey, recipient',
  people: '++pubkey',
  rooms: '++id, joined',
})

// A flag for hiding things that rely on people being loaded initially
export const ready = writable(false)

// Some things work better as observables than database tables
export const people = writable([])

// Bootstrap our people observable
db.table('people').toArray().then($p => {
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
  await db.table('people').bulkPut(Object.values(updates))
}

// Hooks

export const processEvents = async events => {
  await Promise.all([
    processProfileEvents(events),
    processRoomEvents(events),
    processMessages(events),
  ])
}

const processProfileEvents = async events => {
  const profileEvents = ensurePlural(events)
    .filter(e => personKinds.includes(e.kind))

  const updates = {}
  for (const e of profileEvents) {
    const person = getPerson(e.pubkey, true)

    updates[e.pubkey] = {
      ...person,
      ...updates[e.pubkey],
      ...switcherFn(e.kind, {
        0: () => {
          try {
            const content = JSON.parse(e.content)

            // Fire off a nip05 verification
            if (content.nip05) {
              verifyNip05(e.pubkey, content.nip05)
            }

            return content
          } catch (e) {
            console.warn(e)
          }
        },
        2: () => {
          if (e.created_at > (person.relays_updated_at || 0)) {
            return {
              relays: ($people[e.pubkey]?.relays || []).concat({url: e.content}),
              relays_updated_at: e.created_at,
            }
          }
        },
        3: () => {
          const data = {petnames: e.tags}

          if (e.created_at > (person.relays_updated_at || 0)) {
            try {
              Object.assign(data, {
                relays_updated_at: e.created_at,
                relays: Object.entries(JSON.parse(e.content))
                  .map(([url, {write, read}]) => ({url, write: write ? '' : '!', read: read ? '' : '!'}))
                  .filter(r => isRelay(r.url)),
              })
            } catch (e) {
              console.warn(e)
            }
          }

          return data
        },
        12165: () => ({muffle: e.tags}),
        10001: () => {
          if (e.created_at > (person.relays_updated_at || 0)) {
            return {
              relays: e.tags.map(([url, read, write]) => ({url, read, write})),
              relays_updated_at: e.created_at,
            }
          }
        },
        default: () => {
          console.log(`Received unsupported event type ${e.kind}`)
        },
      }),
      updated_at: now(),
    }
  }

  await updatePeople(updates)
}

const processRoomEvents = async events => {
  const roomEvents = ensurePlural(events)
    .filter(e => [40, 41].includes(e.kind))

  const updates = {}
  for (const e of roomEvents) {
    let content
    try {
      content = pick(roomAttrs, JSON.parse(e.content))
    } catch (e) {
      continue
    }

    const roomId = e.kind === 40 ? e.id : Tags.from(e).type("e").values().first()

    if (!roomId) {
      continue
    }

    const room = await db.table('rooms').get(roomId)

    // Merge edits but don't let old ones override new ones
    if (room?.edited_at > e.created_at) {
      continue
    }

    // There are some non-standard rooms out there, ignore them
    // if they don't have a name
    if (content.name) {
      updates[roomId] = {
        joined: 0,
        ...room,
        ...updates[roomId],
        ...content,
        id: roomId,
        pubkey: e.pubkey,
        edited_at: e.created_at,
        updated_at: now(),
      }
    }
  }

  await db.table('rooms').bulkPut(Object.values(updates))
}

const processMessages = async events => {
  const messages = ensurePlural(events)
    .filter(e => e.kind === 4)
    .map(e => ({...e, recipient: Tags.from(e).type("p").values().first()}))

  if (messages.length > 0) {
    await db.table('messages').bulkPut(messages)
  }
}

// Utils

const verifyNip05 = (pubkey, as) =>
  nip05.queryProfile(as).then(result => {
    if (result?.pubkey === pubkey) {
      const person = getPerson(pubkey, true)

      updatePeople({[pubkey]: {...person, verified_as: as}})
    }
  }, noop)
