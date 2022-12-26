import {liveQuery} from 'dexie'
import extractUrls from 'extract-urls'
import {get} from 'svelte/store'
import {intersection, find, sortBy, propEq, uniqBy, groupBy, concat, without, prop, isNil, identity} from 'ramda'
import {ensurePlural, first, createMap, ellipsize} from 'hurdak/lib/hurdak'
import {escapeHtml} from 'src/util/html'
import {filterTags, getTagValues, findReply, findRoot} from 'src/util/nostr'
import {db} from 'src/relay/db'
import pool from 'src/relay/pool'
import cmd from 'src/relay/cmd'

// Livequery appears to swallow errors

const lq = f => liveQuery(async () => {
  try {
    return await f()
  } catch (e) {
    console.error(e)
  }
})

// Utils for filtering db - nothing below should load events from the network

const filterEvents = async ({limit, ...filter}) => {
  let events = db.events

  // Sorting is expensive, so prioritize that unless we have a filter that will dramatically
  // reduce the number of results so we can do ordering in memory
  if (filter.ids) {
    events = await db.events.where('id').anyOf(ensurePlural(filter.ids)).reverse().sortBy('created')
  } else if (filter.authors) {
    events = await db.events.where('pubkey').anyOf(ensurePlural(filter.authors)).reverse().sortBy('created')
  } else {
    events = await events.orderBy('created_at').reverse().toArray()
  }

  const result = []
  for (const e of events) {
    if (filter.ids && !filter.ids.includes(e.id)) continue
    if (filter.authors && !filter.authors.includes(e.pubkey)) continue
    if (filter.muffle && filter.muffle.includes(e.pubkey)) continue
    if (filter.kinds && !filter.kinds.includes(e.kind)) continue
    if (filter.since && filter.since > e.created_at) continue
    if (filter.until && filter.until < e.created_at) continue
    if (filter['#p'] && intersection(filter['#p'], getTagValues(e.tags)).length === 0) continue
    if (filter['#e'] && intersection(filter['#e'], getTagValues(e.tags)).length === 0) continue
    if (!isNil(filter.content) && filter.content !== e.content) continue
    if (filter.customFilter && !filter.customFilter(e)) continue

    result.push(e)

    if (result.length > limit) {
      break
    }
  }

  return result
}

const filterReplies = async (id, filter) => {
  const events = await db.events.where('reply').equals(id).toArray()

  return events.filter(e => e.kind === 1)
}

const filterReactions = async (id, filter) => {
  const events = await db.events.where('reply').equals(id).toArray()

  return events.filter(e => e.kind === 7)
}

const findNote = async (id, {showEntire = false, depth = 1} = {}) => {
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
    repliesCount: replies.length,
    replies: depth === 0
      ? []
      : await Promise.all(
          sortBy(e => -e.created_at, replies)
          .slice(0, showEntire ? Infinity : 3)
          .map(r => findNote(r.id, {depth: depth - 1}))
      ),
  }
}

const annotateChunk = async chunk => {
  const ancestorIds = concat(chunk.map(findRoot), chunk.map(findReply)).filter(identity)
  const ancestors = await filterEvents({kinds: [1], ids: ancestorIds})

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

  const notes = await Promise.all(Object.keys(notesByRoot).map(findNote))

  // Re-sort, since events come in order regardless of level in the hierarchy.
  // This is really a hack, since a single like can bump an old note back up to the
  // top of the feed. Also, discard non-notes (e.g. reactions)
  return sortBy(e => -e.created_at, notes.filter(propEq('kind', 1)))
}

const renderNote = async (note, {showEntire = false}) => {
  const shouldEllipsize = note.content.length > 500 && !showEntire
  const $people = get(db.people)
  const peopleByPubkey = createMap(
    'pubkey',
    filterTags({tag: "p"}, note).map(k => $people[k]).filter(identity)
  )

  let content

  // Ellipsize
  content = shouldEllipsize ? ellipsize(note.content, 500) : note.content

  // Escape html
  content = escapeHtml(content)

  // Extract urls
  for (const url of extractUrls(content) || []) {
    const $a = document.createElement('a')

    $a.href = url
    $a.target = "_blank noopener"
    $a.className = "underline"

    /* eslint no-useless-escape: 0 */
    $a.innerText = first(url.replace(/https?:\/\/(www\.)?/, '').split(/[\/\?#]/))

    // If the url is on its own line, remove it entirely. Otherwise, replace it with the link
    content = content.replace(url, $a.outerHTML)
  }

  // Mentions
  content = content
    .replace(/#\[(\d+)\]/g, (tag, i) => {
      if (!note.tags[parseInt(i)]) {
        return tag
      }

      const pubkey = note.tags[parseInt(i)][1]
      const person = peopleByPubkey[pubkey]
      const name = person?.name || pubkey.slice(0, 8)

      return `@<a href="/people/${pubkey}/notes" class="underline">${name}</a>`
    })

  return content
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

const loadNoteContext = async (note, {loadParent = false} = {}) => {
  const $people = get(people)
  const filter = [{kinds: [1, 5, 7], '#e': [note.id]}]

  // Load the author if needed
  if (!$people[note.pubkey]) {
    filter.push({kinds: [0], authors: [note.pubkey]})
  }

  // Load the note's parent
  const parentId = findReply(note)
  if (loadParent && parentId) {
    filter.push({kinds: [1], ids: [parentId]})
  }

  // Load the events
  const events = await pool.loadEvents(filter)

  // Load the note's context as well
  const parent = find(propEq('id', parentId), events)
  if (loadParent && parent) {
    await loadNoteContext(parent)
  }
}

const getOrLoadNote = async id => {
  if (!await db.events.get(id)) {
    await pool.loadEvents({kinds: [1], ids: [id]})
  }

  const note = await db.events.get(id)

  if (note) {
    await loadNoteContext(note, {loadParent: true})
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
  db, pool, cmd, lq, filterEvents, getOrLoadNote, filterReplies, findNote,
  annotateChunk, renderNote, login, addRelay, removeRelay,
  follow, unfollow, loadNoteContext,
}
