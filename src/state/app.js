import {when, assoc, prop, identity, whereEq, reverse, uniq, sortBy, uniqBy, find, last, pluck, groupBy} from 'ramda'
import {debounce} from 'throttle-debounce'
import {writable, get} from 'svelte/store'
import {navigate} from "svelte-routing"
import {switcherFn, ensurePlural} from 'hurdak/lib/hurdak'
import {getLocalJson, setLocalJson, now, timedelta, sleep} from "src/util/misc"
import {user} from 'src/state/user'
import {filterMatches, Cursor, channels, relays, findReplyTo} from 'src/state/nostr'

export const modal = writable(null)

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
    const events = await channels.getter.all({kinds: [0], authors: pubkeys})

    await accounts.update($accounts => {
      events.forEach(e => {
        $accounts[e.pubkey] = {
          pubkey: e.pubkey,
          ...$accounts[e.pubkey],
          ...JSON.parse(e.content),
          refreshed: now(),
        }
      })

      return $accounts
    })
  }

  // Keep our user in sync
  user.update($user => ({...$user, ...get(accounts)[$user.pubkey]}))
}

// Notes

export const annotateNotesChunk = async (chunk, {showParents = false} = {}) => {
  const parentIds = chunk.map(findReplyTo).filter(identity)

  if (showParents && parentIds.length) {
    // Find parents of replies to provide context
    const parents = await channels.getter.all({
      kinds: [1],
      ids: parentIds,
    })

    // Remove replies, show parents instead
    chunk = parents
      .concat(chunk.filter(e => !find(whereEq({id: findReplyTo(e)}), parents)))
  }

  if (chunk.length === 0) {
    return chunk
  }

  const replies = await channels.getter.all({
    kinds: [1],
    '#e': pluck('id', chunk),
  })

  const reactions = await channels.getter.all({
    kinds: [7],
    '#e': pluck('id', chunk.concat(replies)),
  })

  const repliesById = groupBy(
    n => find(t => last(t) === 'reply', n.tags)[1],
    replies.filter(n => n.tags.map(last).includes('reply'))
  )

  const reactionsById = groupBy(
    n => find(t => last(t) === 'reply', n.tags)[1],
    reactions.filter(n => n.tags.map(last).includes('reply'))
  )

  await ensureAccounts(uniq(pluck('pubkey', chunk.concat(replies).concat(reactions))))

  const $accounts = get(accounts)

  const annotate = e => ({
    ...e,
    user: $accounts[e.pubkey],
    replies: (repliesById[e.id] || []).map(reply => annotate(reply)),
    reactions: (reactionsById[e.id] || []).map(reaction => annotate(reaction)),
  })

  return reverse(sortBy(prop('created'), chunk.map(annotate)))
}

export const notesLoader = async (
  notes,
  filter,
  {
    showParents = false,
    delta = timedelta(1, 'hours'),
    isInModal = false,
    since = 1633046400, // nostr epoch
  } = {}
) => {
  const cursor = new Cursor(filter, delta)

  const onScroll = debounce(1000, async () => {
    /* eslint no-constant-condition: 0 */
    while (true) {
      // If a modal opened up, wait for them to close it
      if (!isInModal && get(modal)) {
        await sleep(1000)

        continue
      }

      // While we have empty space, fill it
      if (window.scrollY + window.innerHeight * 3 < document.body.scrollHeight) {
        break
      }

      // Stop if we've gone back far enough
      if (cursor.since <= since) {
        break
      }

      const chunk = await cursor.chunk()
      const annotated = await annotateNotesChunk(chunk, {showParents})

      notes.update($notes => uniqBy(prop('id'), $notes.concat(annotated)))

      // If we have an empty chunk, increase our step size so we can get back to where
      // we might have old events. Once we get a chunk, knock it down to the default again
      if (annotated.length === 0) {
        cursor.delta = Math.min(timedelta(30, 'days'), cursor.delta * 2)
      } else {
        cursor.delta = delta
      }
    }
  })

  onScroll()

  return {
    cursor,
    onScroll,
    unsub: () => {
      cursor.stop()
    },
  }
}

export const notesListener = async (notes, filter) => {
  const updateNote = (id, f) =>
    notes.update($notes =>
      $notes
        .map(n => {
          if (n.id === id) {
            return f(n)
          }

          return {...n, replies: n.replies.map(when(whereEq({id}), f))}
        })
    )

  const deleteNotes = ($notes, ids) =>
    $notes
      .filter(e => !ids.includes(e.id))
      .map(n => ({
        ...n,
        replies: deleteNotes(n.replies, ids),
        reactions: n.reactions.filter(e => !ids.includes(e.id)),
      }))

  return await channels.listener.sub(
    ensurePlural(filter).map(assoc('since', now())),
    e => switcherFn(e.kind, {
      1: async () => {
        const id = findReplyTo(e)

        if (id) {
          const [reply] = await annotateNotesChunk([e])

          updateNote(id, n => ({...n, replies: n.replies.concat(reply)}))
        } else if (filterMatches(filter, e)) {
          const [note] = await annotateNotesChunk([e])

          notes.update($notes => uniqBy(prop('id'), [note].concat($notes)))
        }
      },
      5: () => {
        const ids = e.tags.map(t => t[1])

        notes.update($notes => deleteNotes($notes, ids))
      },
      7: () => {
        const id = findReplyTo(e)

        updateNote(id, n => ({...n, reactions: n.reactions.concat(e)}))
      }
    })
  )
}
