import {liveQuery} from 'dexie'
import {get} from 'svelte/store'
import {pluck, uniqBy, groupBy, concat, without, prop, uniq, objOf, isNil, identity} from 'ramda'
import {ensurePlural, createMap, ellipsize, first} from 'hurdak/lib/hurdak'
import {escapeHtml} from 'src/util/html'
import {filterTags, findReply, findRoot} from 'src/util/nostr'
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

// Filter builders

export const buildNoteContextFilter = async (note, extra = {}) => {
    const replyId = findReply(note)
    const filter = [
      {...extra, kinds: [1, 5, 7], '#e': [note.id]},
      {kinds: [0], authors: [note.pubkey]}]

    if (replyId && !await db.events.get(replyId)) {
      filter.push({...extra, kinds: [1], ids: [replyId]})
    }

    return filter
}

// Utils for querying dexie - these return collections, not arrays

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

// Utils for filtering db - nothing below should load events from the network

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

const findNote = async (id, {showEntire = false} = {}) => {
  const note = await db.events.get(id)

  if (!note) {
    return
  }

  const reactions = await filterReactions(note.id)
  const replies = await filterReplies(note.id)
  const person = prop(note.pubkey, get(db.people))
  const html = await renderNote(note, {showEntire})

  let parent = null
  const parentId = findReply(note)
  if (parentId) {
    parent = await db.events.get(parentId)

    if (parent) {
      parent = {
        ...parent,
        reactions: await filterReactions(parent.id),
        person: prop(parent.pubkey, get(db.people)),
        html: await renderNote(parent, {showEntire}),
      }
    }
  }

  return {
    ...note, reactions, person, html, parent,
    replies: await Promise.all(replies.map(r => findNote(r.id))),
  }
}

const annotateChunk = async chunk => {
  const ancestorIds = concat(chunk.map(findRoot), chunk.map(findReply)).filter(identity)
  const ancestors = await filterEvents({kinds: [1], ids: ancestorIds}).toArray()

  const allNotes = uniqBy(prop('id'), chunk.concat(ancestors))
  const notesById = createMap('id', allNotes)
  const notesByRoot = groupBy(
    n => {
      const rootId = findRoot(n)
      const parentId = findReply(n)

      // Actually dereference the notes in case we weren't able to retrieve them
      if (notesById[rootId]) {
        return rootId
      }

      if (notesById[parentId]) {
        return parentId
      }

      return n.id
    },
    allNotes
  )

  return await Promise.all(Object.keys(notesByRoot).map(findNote))
}

const renderNote = async (note, {showEntire = false}) => {
  const $people = get(db.people)

  const shouldEllipsize = note.content.length > 500 && !showEntire
  const content = shouldEllipsize ? ellipsize(note.content, 500) : note.content
  const peopleByPubkey = createMap(
    'pubkey',
    filterTags({tag: "p"}, note).map(k => $people[k]).filter(identity)
  )

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

// Synchronization

const login = ({privkey, pubkey}) => {
  db.user.set({relays: [], muffle: [], petnames: [], updated_at: 0, pubkey, privkey})

  pool.syncNetwork()
}

const addRelay = url => {
  db.connections.update($connections => $connections.concat(url))

  pool.syncNetwork()
}

const removeRelay = url => {
  db.connections.update($connections => without([url], $connections))
}

const follow = async pubkey => {
  db.network.update($network => $network.concat(pubkey))

  pool.syncNetwork()
}

const unfollow = async pubkey => {
  db.network.update($network => $network.concat(pubkey))
}

// Methods that wil attempt to load from the database and fall back to the network.
// This is intended only for bootstrapping listeners

const getOrLoadNote = async (id, {showEntire = false} = {}) => {
  const note = await db.events.get(id)

  if (!note) {
    return first(await pool.loadEvents({kinds: [1], ids: [id]}))
  }

  return note
}

// Initialization

db.user.subscribe($user => {
  if ($user?.privkey) {
    pool.setPrivateKey($user.privkey)
  } else if ($user?.pubkey) {
    pool.setPublicKey($user.pubkey)
  }
})

db.connections.subscribe($connections => {
  const poolRelays = pool.getRelays()

  for (const url of $connections) {
    if (!poolRelays.includes(url)) {
      pool.addRelay(url)
    }
  }

  for (const url of poolRelays) {
    if (!$connections.includes(url)) {
      pool.removeRelay(url)
    }
  }
})

// Export stores on their own for convenience

export const user = db.user
export const people = db.people
export const network = db.network
export const connections = db.connections

export default {
  db, pool, lq, buildNoteContextFilter, filterEvents, getOrLoadNote,
  filterReplies, findNote, annotateChunk, renderNote, filterAlerts,
  login, addRelay, removeRelay, follow, unfollow,
}
