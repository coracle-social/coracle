import {liveQuery} from 'dexie'
import {pluck, uniq, objOf, isNil} from 'ramda'
import {ensurePlural, createMap, ellipsize, first} from 'hurdak/lib/hurdak'
import {now, timedelta} from 'src/util/misc'
import {escapeHtml} from 'src/util/html'
import {filterTags} from 'src/util/nostr'
import {db} from 'src/relay/db'
import pool from 'src/relay/pool'

// Livequery appears to swallow errors
const lq = f => liveQuery(async () => {
  try {
    return await f()
  } catch (e) {
    console.error(e)
  }
})

const ensurePerson = async ({pubkey}) => {
  const person = await db.people.where('pubkey').equals(pubkey).first()

  // Throttle updates for people
  if (!person || person.updated_at < now() - timedelta(1, 'hours')) {
    await pool.syncPersonInfo({pubkey, ...person})
  }
}

const ensureContext = async events => {
  const promises = []
  const people = uniq(pluck('pubkey', events)).map(objOf('pubkey'))
  const ids = events.flatMap(e => filterTags({tag: "e"}, e).concat(e.id))

  if (people.length > 0) {
    for (const p of people.map(ensurePerson)) {
      promises.push(p)
    }
  }

  if (ids.length > 0) {
    promises.push(
      pool.fetchEvents([
        {kinds: [1, 5, 7], '#e': ids},
        {kinds: [1, 5], ids},
      ])
    )
  }

  await Promise.all(promises)
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
      if (filter.since && filter.since > e.created_at) return false
      if (filter.until && filter.until < e.created_at) return false
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

const findNote = async (id, giveUp = false) => {
  const [note, children] = await Promise.all([
    db.events.get(id),
    db.events.where('reply').equals(id),
  ])

  // If we don't have it, try to retrieve it
  if (!note) {
    console.warning(`Failed to find context for note ${id}`)

    if (giveUp) {
      return null
    }

    await ensureContext([
      await pool.fetchEvents({ids: [id]}),
    ])

    return findNote(id, true)
  }

  const [replies, reactions, person, html] = await Promise.all([
    children.clone().filter(e => e.kind === 1).toArray(),
    children.clone().filter(e => e.kind === 7).toArray(),
    db.people.get(note.pubkey),
    renderNote(note, {showEntire: false}),
  ])

  return {
    ...note, reactions, person, html,
    replies: await Promise.all(replies.map(r => findNote(r.id))),
  }
}

const renderNote = async (note, {showEntire = false}) => {
  const shouldEllipsize = note.content.length > 500 && !showEntire
  const content = shouldEllipsize ? ellipsize(note.content, 500) : note.content
  const people = await db.people.where('pubkey').anyOf(filterTags({tag: "p"}, note)).toArray()
  const peopleByPubkey = createMap('pubkey', people)

  return escapeHtml(content)
    .replace(/\n/g, '<br />')
    .replace(/https?:\/\/([\w.-]+)[^ ]*/g, (url, domain) => {
      return `<a href="${url}" target="_blank noopener" class="underline">${domain}</a>`
    })
    .replace(/#\[(\d+)\]/g, (tag, i) => {
      if (!note.tags[parseInt(i)]) {
        return tag
      }

      const pubkey = note.tags[parseInt(i)][1]
      const person = peopleByPubkey[pubkey]
      const name = person?.name || pubkey.slice(0, 8)

      return `@<a href="/people/${pubkey}/notes" class="underline">${name}</a>`
    })
}

const filterAlerts = async (person, filter) => {
  const tags = db.tags.where('value').equals(person.pubkey)
  const ids = pluck('event', await tags.toArray())
  const events = await filterEvents({...filter, kinds: [1, 7], ids})

  return events
}

export default {
  db, pool, lq, ensurePerson, ensureContext, filterEvents, filterReactions,
  countReactions, findReaction, filterReplies, findNote, renderNote, filterAlerts,
}
