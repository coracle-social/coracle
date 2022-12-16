import Dexie from 'dexie'
import {defmulti} from 'hurdak/lib/hurdak'
import {now, timedelta} from 'src/util/misc'
import {worker} from 'src/relay/worker'

export const db = new Dexie('coracle/relay')

db.version(1).stores({
  events: '++id, pubkey, created_at, kind, content',
  users: '++pubkey, name, about',
  tags: 'type, value, event',
})

// Hooks

db.events.hook('creating', (id, {pubkey, tags}, t) => {
  // We can't return a promise, so use setTimeout instead
  setTimeout(async () => {
    const user = await db.users.where('pubkey').equals(pubkey).first()

    // Throttle updates for users
    if (!user || user.updated_at < now() - timedelta(1, 'hours')) {
      worker.post('user/update', user || {pubkey, updated_at: 0})
    }
  })
})

// Listen to worker

const withPayload = f => e => f(e.data.payload)

worker.onmessage = defmulti('onmessage', e => e.data.topic)

worker.onmessage.addMethod('events/put', withPayload(e => {
  db.events.put(e)
}))
