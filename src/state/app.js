import {prop, identity, whereEq, reverse, uniq, sortBy, uniqBy, find, last, pluck, groupBy} from 'ramda'
import {debounce} from 'throttle-debounce'
import {writable, get} from 'svelte/store'
import {navigate} from "svelte-routing"
import {switcherFn} from 'hurdak/lib/hurdak'
import {getLocalJson, setLocalJson, now, timedelta, sleep} from "src/util/misc"
import {user} from 'src/state/user'
import {_channels, filterMatches, Cursor, channels, relays, findReply} from 'src/state/nostr'

export const modal = writable(null)

export const accounts = writable(getLocalJson("coracle/accounts") || {})

accounts.subscribe($accounts => {
  setLocalJson("coracle/accounts", $accounts)
})

user.subscribe($user => {
  if ($user) {
    accounts.update($accounts => ({...$accounts, [$user.pubkey]: $user}))
  }
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
  if (showParents) {
    // Find parents of replies to provide context
    const parents = await _channels.getter.all({
      kinds: [1],
      ids: chunk.map(findReply).filter(identity),
    })

    // Remove replies, show parents instead
    chunk = parents
      .concat(chunk.filter(e => !find(whereEq({id: findReply(e)}), parents)))
  }

  if (chunk.length === 0) {
    return chunk
  }

  const replies = await _channels.getter.all({
    kinds: [1],
    '#e': pluck('id', chunk),
  })

  const reactions = await _channels.getter.all({
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

export const notesCursor = async (
  filter,
  {
    showParents = false,
    delta = timedelta(1, 'hours'),
    isInModal = false,
  } = {}
) => {
  const cursor = new Cursor(filter, delta)
  const notes = writable([])

  const addChunk = chunk => {
    notes.update($notes => uniqBy(prop('id'), $notes.concat(chunk)))
  }

  const unsub = await _channels.listener.sub(
    {kinds: [1, 5, 7], since: now()},
    e => switcherFn(e.kind, {
      1: async () => {
        if (filterMatches(filter, e)) {
          addChunk(await annotateNotesChunk([e], {showParents}))
        }
      },
      5: () => {
        const ids = e.tags.map(t => t[1])

        notes.update($notes =>
          $notes
            .filter(e => !ids.includes(e.id))
            .map(n => ({
              ...n,
              replies: n.replies.filter(e => !ids.includes(e.id)),
              reactions: n.reactions.filter(e => !ids.includes(e.id)),
            }))
        )
      },
      7: () => {
        const id = findReply(e)

        notes.update($notes =>
          $notes
            .map(n => {
              if (n.id === id) {
                return {...n, reactions: [...n.reactions, e]}
              }

              return {
                ...n,
                replies: n.replies.map(r => {
                  if (r.id === id) {
                    return {...r, reactions: [...r.reactions, e]}
                  }

                  return r
                }),
              }
            })
        )
      }
    })
  )

  const loadChunk = async () => {
    const chunk = await annotateNotesChunk(await cursor.chunk(), {showParents})

    addChunk(chunk)

    // If we have an empty chunk, increase our step size so we can get back to where
    // we might have old events. Once we get a chunk, knock it down to the default again
    if (chunk.length === 0) {
      cursor.delta = Math.min(timedelta(30, 'days'), cursor.delta * 2)
    } else {
      cursor.delta = delta
    }
  }

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

      // If we've gone back to the network's inception we're done
      if (cursor.since <= 1633046400) {
        break
      }

      await loadChunk()
    }
  })

  onScroll()

  return {
    notes,
    onScroll,
    unsub: () => {
      cursor.stop()
      unsub()
    },
  }
}

