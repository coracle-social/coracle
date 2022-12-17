import {identity, uniq, propEq, uniqBy, prop, groupBy, pluck} from 'ramda'
import {debounce} from 'throttle-debounce'
import {get} from 'svelte/store'
import {getMuffleValue, epoch, filterMatches, findReply} from 'src/util/nostr'
import {switcherFn, createMap} from 'hurdak/lib/hurdak'
import {timedelta, sleep} from "src/util/misc"
import {Listener, channels} from 'src/state/nostr'

export const annotateNotes = async (notes, {showParent = false} = {}) => {
  if (notes.length === 0) {
    return []
  }

  const noteIds = pluck('id', notes)
  const parentIds = notes.map(findReply).filter(identity)
  const filters = [{kinds: [1, 7], '#e': noteIds}]

  if (showParent && parentIds.length > 0) {
    filters.push({kinds: [1], ids: parentIds})
    filters.push({kinds: [7], '#e': parentIds})
  }

  const events = await channels.getter.all(filters)

  await ensureAccounts(uniq(pluck('pubkey', notes.concat(events))))

  const $accounts = get(accounts)
  const reactionsByParent = groupBy(findReply, events.filter(propEq('kind', 7)))
  const allNotes = uniqBy(prop('id'), notes.concat(events.filter(propEq('kind', 1))))
  const notesById = createMap('id', allNotes)

  const annotate = note => ({
    ...note,
    user: $accounts[note.pubkey],
    reactions: reactionsByParent[note.id] || [],
    children: uniqBy(prop('id'), allNotes.filter(n => findReply(n) === note.id)).map(annotate),
  })

  return notes.map(note => {
    const parentId = findReply(note)

    // If we have a parent, return that instead
    return annotate(
      showParent && notesById[parentId]
        ? notesById[parentId]
        : note
    )
  })
}


export const annotateNewNote = async (note) => {
  await ensureAccounts([note.pubkey])

  const $accounts = get(accounts)

  return {
    ...note,
    user: $accounts[note.pubkey],
    children: [],
    reactions: [],
  }
}

export const notesListener = (notes, filter, {shouldMuffle = false, repliesOnly = false} = {}) => {
  const updateNote = (note, id, f) => {
    if (note.id === id) {
      return f(note)
    }

    return {
      ...note,
      parent: note.parent ? updateNote(note.parent, id, f) : null,
      children: note.children.map(n => updateNote(n, id, f)),
    }
  }

  const updateNotes = (id, f) =>
    notes.update($notes => $notes.map(n => updateNote(n, id, f)))

  const deleteNote = (note, ids, deleted_at) => {
    if (ids.includes(note.id)) {
      return {...note, deleted_at}
    }

    return {
      ...note,
      parent: note.parent ? deleteNote(note.parent, ids, deleted_at) : null,
      children: note.children.map(n => deleteNote(n, ids, deleted_at)),
      reactions: note.reactions.filter(e => !ids.includes(e.id)),
    }
  }

  const deleteNotes = (ids, t) =>
    notes.update($notes => $notes.map(n => deleteNote(n, ids, t)))

  return new Listener(filter, e => switcherFn(e.kind, {
    1: async () => {
      const id = findReply(e)
      const muffle = shouldMuffle && Math.random() > getMuffleValue(e.pubkey)

      if (id) {
        const note = await annotateNewNote(e)

        updateNotes(id, n => ({...n, children: n.children.concat(note)}))
      } else if (!repliesOnly && !muffle && filterMatches(filter, e)) {
        const [note] = await threadify([e])

        notes.update($notes => [note].concat($notes))
      }
    },
    5: () => {
      deleteNotes(e.tags.map(t => t[1]), e.created_at)
    },
    7: () => {
      updateNotes(findReply(e), n => ({...n, reactions: n.reactions.concat(e)}))
    }
  }))
}

// UI

export const createScroller = (
  cursor,
  onChunk,
  {since = epoch, reverse = false} = {}
) => {
  const startingDelta = cursor.delta

  let active = false

  const start = debounce(1000, async () => {
    if (active) {
      return
    }

    active = true

    /* eslint no-constant-condition: 0 */
    while (true) {
      // While we have empty space, fill it
      const {scrollY, innerHeight} = window
      const {scrollHeight} = document.body

      if (
        (reverse && scrollY > innerHeight * 2)
        || (!reverse && scrollY + innerHeight * 2 < scrollHeight)
      ) {
        break
      }

      // Stop if we've gone back far enough
      if (cursor.since <= since) {
        break
      }

      // Get our chunk
      const chunk = await cursor.chunk()

      // Notify the caller
      if (chunk.length > 0) {
        await onChunk(chunk)
      }

      // If we have an empty chunk, increase our step size so we can get back to where
      // we might have old events. Once we get a chunk, knock it down to the default again
      if (chunk.length === 0) {
        cursor.delta = Math.min(timedelta(30, 'days'), cursor.delta * 2)
      } else {
        cursor.delta = startingDelta
      }

      if (!active) {
        break
      }

      // Wait a moment before proceeding to the next chunk for the caller
      // to load results into the dom
      await sleep(500)
    }

    active = false
  })

  return {
    start,
    stop: () => { active = false },
    isActive: () => Boolean(cursor.sub),
  }
}
