import {liveQuery} from 'dexie'
import {pluck, isNil} from 'ramda'
import {ensurePlural, first} from 'hurdak/lib/hurdak'
import {now, timedelta} from 'src/util/misc'
import {db} from 'src/relay/db'
import {worker} from 'src/relay/worker'

// Livequery appears to swallow errors
const lq = f => liveQuery(async () => {
  try {
    return await f()
  } catch (e) {
    console.error(e)
  }
})

const ensureContext = async e => {
  // We can't return a promise, so use setTimeout instead
  const user = await db.users.where('pubkey').equals(e.pubkey).first()

  // Throttle updates for users
  if (!user || user.updated_at < now() - timedelta(1, 'hours')) {
    worker.post('user/update', user || {pubkey: e.pubkey, updated_at: 0})
  }

  // TODO optimize this like user above so we're not double-fetching
  worker.post('event/fetchContext', e)
}

const prefilterEvents = filter => {
  if (filter.ids) {
    return db.events.where('id').anyOf(ensurePlural(filter.ids))
  }

  if (filter.authors) {
    return db.events.where('pubkey').anyOf(ensurePlural(filter.authors))
  }

  if (filter.kinds) {
    return db.events.where('kind').anyOf(ensurePlural(filter.kinds))
  }

  return db.events
}

const filterEvents = filter => {
  return prefilterEvents(filter)
    .filter(e => {
      if (filter.ids && !filter.ids.includes(e.id)) return false
      if (filter.authors && !filter.authors.includes(e.pubkey)) return false
      if (filter.kinds && !filter.kinds.includes(e.kind)) return false
      if (!isNil(filter.content) && filter.content !== e.content) return false

      return true
    })
}

const filterReplies = async (id, filter) => {
  const tags = db.tags.where('value').equals(id).filter(t => t.mark === 'reply')
  const ids = pluck('event', await tags.toArray())
  const replies = await filterEvents({...filter, kinds: [1], ids}).toArray()

  return replies
}

const filterReactions = async (id, filter) => {
  const tags = db.tags.where('value').equals(id).filter(t => t.mark === 'reply')
  const ids = pluck('event', await tags.toArray())
  const reactions = await filterEvents({...filter, kinds: [7], ids}).toArray()

  return reactions
}

const findReaction = async (id, filter) =>
  first(await filterReactions(id, filter))

const countReactions = async (id, filter) =>
  (await filterReactions(id, filter)).length

export default {
  db, worker, lq, ensureContext, filterEvents, filterReactions, countReactions,
  findReaction, filterReplies,
}
