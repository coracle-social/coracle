import Dexie from 'dexie'
import {filterTags} from 'src/util/nostr'

export const db = new Dexie('coracle/relay')

db.version(2).stores({
  events: '++id, pubkey, created_at, kind, content',
  users: '++pubkey, name, about',
  tags: '++key, event, value',
})

window.db = db

// Hooks

db.events.hook('creating', (id, e, t) => {
  setTimeout(() => {
    for (const tag of e.tags) {
      db.tags.put({
        id: [id, ...tag.slice(0, 2)].join(':'),
        event: id,
        type: tag[0],
        value: tag[1],
        relay: tag[2],
        mark: tag[3],
      })
    }

    if (e.kind === 5) {
      const eventIds = filterTags({tag: "e"}, e)

      db.events.where('id').anyOf(eventIds).delete()
      db.tags.where('event').anyOf(eventIds).delete()
    }
  })
})
