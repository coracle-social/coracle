import {identity, uniq, concat, propEq, uniqBy, prop, groupBy, find, last, pluck} from 'ramda'
import {debounce} from 'throttle-debounce'
import {writable, get} from 'svelte/store'
import {navigate} from "svelte-routing"
import {globalHistory} from "svelte-routing/src/history"
import {switcherFn, createMap} from 'hurdak/lib/hurdak'
import {getLocalJson, setLocalJson, now, timedelta, sleep} from "src/util/misc"
import {user} from 'src/state/user'
import {epoch, filterMatches, Listener, channels, relays, findReply, findRoot} from 'src/state/nostr'

export const modal = {
  subscribe: cb => {
    const getModal = () =>
      location.hash.includes('#modal=')
        ? JSON.parse(decodeURIComponent(escape(atob(location.hash.replace('#modal=', '')))))
        : null

    cb(getModal())

    return globalHistory.listen(() => cb(getModal()))
  },
  set: data => {
    let path = location.pathname
    if (data) {
      path += '#modal=' + btoa(unescape(encodeURIComponent(JSON.stringify(data))))
    }

    navigate(path)
  },
}

export const settings = writable({
  showLinkPreviews: true,
  dufflepudUrl: import.meta.env.VITE_DUFFLEPUD_URL,
  ...getLocalJson("coracle/settings"),
})

settings.subscribe($settings => {
  setLocalJson("coracle/settings", $settings)
})

export const logout = () => {
  // Give any animations a moment to finish
  setTimeout(() => {
    user.set(null)
    relays.set([])
    navigate("/login")
  }, 200)
}

// Accounts

export const accounts = writable(getLocalJson("coracle/accounts") || {})

accounts.subscribe($accounts => {
  setLocalJson("coracle/accounts", $accounts)
})

user.subscribe($user => {
  if ($user) {
    accounts.update($accounts => ({...$accounts, [$user.pubkey]: $user}))
  }
})

export const ensureAccounts = async (pubkeys, {force = false} = {}) => {
  const $accounts = get(accounts)

  // Don't request accounts we recently updated
  pubkeys = pubkeys.filter(
    k => force || !$accounts[k] || $accounts[k].refreshed < now() - timedelta(10, 'minutes')
  )

  if (pubkeys.length) {
    const events = await channels.getter.all({kinds: [0, 3, 12165], authors: uniq(pubkeys)})

    await accounts.update($accounts => {
      events.forEach(e => {
        const values = {
          muffle: [],
          petnames: [],
          ...$accounts[e.pubkey],
          pubkey: e.pubkey,
          refreshed: now(),
          isUser: true,
        }

        switcherFn(e.kind, {
          0: () => {
            $accounts[e.pubkey] = {...values, ...JSON.parse(e.content)}
          },
          3: () => {
            $accounts[e.pubkey] = {...values, petnames: e.tags}
          },
          12165: () => {
            $accounts[e.pubkey] = {...values, muffle: e.tags}
          },
        })
      })

      return $accounts
    })
  }

  // Keep our user in sync
  user.update($user => $user ? {...$user, ...get(accounts)[$user.pubkey]} : null)
}

export const getFollow = pubkey => {
  const $user = get(user)

  return $user && find(t => t[1] === pubkey, $user.petnames)
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

// Notes

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
        numberOfAncestors: note.tags.filter(([x]) => x === 'e').length,
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

export const annotateNewNote = async (note) => {
  await ensureAccounts([note.pubkey])

  const $accounts = get(accounts)

  return {
    ...note,
    user: $accounts[note.pubkey],
    numberOfAncestors: note.tags.filter(([x]) => x === 'e').length,
    children: [],
    reactions: [],
  }
}

export const notesListener = (notes, filter, {shouldMuffle = false} = {}) => {
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
      } else if (!muffle && filterMatches(filter, e)) {
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
      await sleep(300)
    }

    active = false
  })

  return {
    start,
    stop: () => { active = false },
    isActive: () => Boolean(cursor.sub),
  }
}
