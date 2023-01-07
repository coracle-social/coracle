import {get} from 'svelte/store'
import {intersection, sortBy, propEq, uniqBy, groupBy, concat, prop, isNil, identity} from 'ramda'
import {ensurePlural, createMap, ellipsize} from 'hurdak/lib/hurdak'
import {renderContent} from 'src/util/html'
import {filterTags, displayPerson, getTagValues, findReply, findRoot} from 'src/util/nostr'
import {db, people, getPerson} from 'src/agent'

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
  const person = getPerson(note.pubkey)
  const html = await renderNote(note, {showEntire})

  let parent = null
  const parentId = findReply(note)
  if (parentId) {
    parent = await db.events.get(parentId)

    if (parent) {
      parent = {
        ...parent,
        reactions: await filterReactions(parent.id),
        person: getPerson(parent.pubkey),
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
          sortBy(e => e.created_at, replies)
          .slice(showEntire ? 0 : -3)
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
  const $people = get(people)
  const peopleByPubkey = createMap(
    'pubkey',
    filterTags({tag: "p"}, note).map(k => $people[k]).filter(identity)
  )

  let content

  // Ellipsize
  content = shouldEllipsize ? ellipsize(note.content, 500) : note.content

  // Escape html, replace urls
  content = renderContent(content)

  // Mentions
  content = content
    .replace(/#\[(\d+)\]/g, (tag, i) => {
      if (!note.tags[parseInt(i)]) {
        return tag
      }

      const pubkey = note.tags[parseInt(i)][1]
      const person = peopleByPubkey[pubkey] || {pubkey}
      const name = displayPerson(person)

      return `@<a href="/people/${pubkey}/notes" class="underline">${name}</a>`
    })

  return content
}

export default {filterEvents, filterReplies, filterReactions, annotateChunk, renderNote, findNote}
