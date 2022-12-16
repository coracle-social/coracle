import {identity, uniq, concat, propEq, uniqBy, prop, groupBy, find, last, pluck} from 'ramda'
import {debounce} from 'throttle-debounce'
import {get} from 'svelte/store'
import {switcherFn, ellipsize, createMap} from 'hurdak/lib/hurdak'
import {timedelta, sleep} from "src/util/misc"
import {escapeHtml} from 'src/util/html'
import {user} from 'src/state/user'
import {epoch, filterMatches, Listener, channels, findReply, findRoot} from 'src/state/nostr'
import {accounts, ensureAccounts} from 'src/state/app'

export const renderNote = (note, {showEntire = false}) => {
  const shouldEllipsize = note.content.length > 500 && !showEntire
  const content = shouldEllipsize ? ellipsize(note.content, 500) : note.content
  const $accounts = get(accounts)

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
      const user = $accounts[pubkey]
      const name = user?.name || pubkey.slice(0, 8)

      return `@<a href="/users/${pubkey}/notes" class="underline">${name}</a>`
    })
}

export const getMuffleValue = pubkey => {
  const $user = get(user)

  if (!$user) {
    return 1
  }

  const tag = find(t => t[1] === pubkey, $user.muffle)

  if (!tag) {
    return 1
  }

  return parseFloat(last(tag))
}

export const threadify = async notes => {
  if (notes.length === 0) {
    return []
  }

  const noteIds = pluck('id', notes)
  const rootIds = notes.map(findReply)
  const parentIds = notes.map(findRoot)
  const ancestorIds = concat(rootIds, parentIds).filter(identity)

  // Find all direct parents and thread roots
  const filters = ancestorIds.length === 0
    ? [{kinds: [1, 7], '#e': noteIds}]
    : [{kinds: [1], ids: ancestorIds},
       {kinds: [1, 7], '#e': noteIds.concat(ancestorIds)}]

  const events = await channels.getter.all(filters)

  await ensureAccounts(uniq(pluck('pubkey', notes.concat(events))))

  const $accounts = get(accounts)
  const reactionsByParent = groupBy(findReply, events.filter(propEq('kind', 7)))
  const allNotes = uniqBy(prop('id'), notes.concat(events.filter(propEq('kind', 1))))
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

  const threads = []
  for (const [rootId, _notes] of Object.entries(notesByRoot)) {
    const annotate = note => {
      return {
        ...note,
        user: $accounts[note.pubkey],
        reactions: reactionsByParent[note.id] || [],
        children: uniqBy(prop('id'), _notes.filter(n => findReply(n) === note.id)).map(annotate),
      }
    }

    threads.push(annotate(notesById[rootId]))
  }

  return threads
}

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

export const annotateAlerts = async events => {
  if (events.length === 0) {
    return []
  }

  const eventIds = pluck('id', events)
  const parentIds = events.map(findReply).filter(identity)
  const filters = [
    {kinds: [1], ids: parentIds},
    {kinds: [7], '#e': parentIds},
    {kinds: [1, 7], '#e': eventIds},
  ]

  const relatedEvents = await channels.getter.all(filters)

  await ensureAccounts(uniq(pluck('pubkey', events.concat(relatedEvents))))

  const $accounts = get(accounts)
  const reactionsByParent = groupBy(findReply, relatedEvents.filter(e => e.kind === 7 && e.content === '+'))
  const allNotes = uniqBy(prop('id'), events.concat(relatedEvents).filter(propEq('kind', 1)))
  const notesById = createMap('id', allNotes)

  const annotate = note => ({
    ...note,
    user: $accounts[note.pubkey],
    reactions: reactionsByParent[note.id] || [],
    children: uniqBy(prop('id'), allNotes.filter(n => findReply(n) === note.id)).map(annotate),
  })

  return uniqBy(e => e.parent?.id || e.id, events.map(event => {
    const parentId = findReply(event)

    return {...annotate(event), parent: annotate(notesById[parentId])}
  }))
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
