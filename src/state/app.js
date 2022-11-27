import {prop, uniq, sortBy, uniqBy, find, last, groupBy} from 'ramda'
import {debounce} from 'throttle-debounce'
import {writable, derived, get} from 'svelte/store'
import {navigate} from "svelte-routing"
import {switcherFn, ensurePlural} from 'hurdak/lib/hurdak'
import {getLocalJson, setLocalJson, now, timedelta} from "src/util/misc"
import {user} from 'src/state/user'
import {channels, relays} from 'src/state/nostr'

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

// Utils

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

export const findNotes = (filters, cb) => {
  const start = () => {
    const notes = writable([])
    const reactions = writable([])

    let pubkeys = []

    const refreshAccounts = debounce(300, () => {
      ensureAccounts(uniq(pubkeys))

      pubkeys = []
    })

    const closeRequest = channels.watcher.sub({
      filter: ensurePlural(filters).map(q => ({kinds: [1, 5, 7], ...q})),
      cb: e => {
        // Chunk requests to load accounts
        pubkeys.push(e.pubkey)
        refreshAccounts()

        switcherFn(e.kind, {
          1: () => {
            notes.update($xs => uniqBy(prop('id'), $xs.concat(e)))
          },
          5: () => {
            const ids = e.tags.map(t => t[1])

            notes.update($xs => $xs.filter(({id}) => !id.includes(ids)))
            reactions.update($xs => $xs.filter(({id}) => !id.includes(ids)))
          },
          7: () => {
            reactions.update($xs => $xs.concat(e))
          },
        })
      },
    })

    const annotatedNotes = derived(
      [notes, reactions, accounts],
      ([$notes, $reactions, $accounts]) => {
        const repliesById = groupBy(
          n => find(t => last(t) === 'reply', n.tags)[1],
          $notes.filter(n => n.tags.map(last).includes('reply'))
        )

        const reactionsById = groupBy(
          n => find(t => last(t) === 'reply', n.tags)[1],
          $reactions.filter(n => n.tags.map(last).includes('reply'))
        )

        const annotate = n => ({
          ...n,
          user: $accounts[n.pubkey],
          replies: (repliesById[n.id] || []).map(reply => annotate(reply)),
          reactions: (reactionsById[n.id] || []).map(reaction => annotate(reaction)),
        })

        return sortBy(prop('created'), $notes.map(annotate))
      }
    )

    const unsubscribe = annotatedNotes.subscribe(debounce(100, cb))

    return () => {
      unsubscribe()

      closeRequest()
    }
  }

  // Allow caller to suspend/restart the subscription
  return start
}

export const findNotesAndWatchModal = (filters, cb) => {
  const start = findNotes(filters, cb)

  let stop = start()

  // Suspend our subscription while we have note detail open
  // so we can avoid exceeding our concurrent subscription limit
  const unsub = modal.subscribe($modal => {
    if ($modal) {
      stop && stop()
      stop = null
    } else if (!stop) {
      // Wait for animations to complete
      setTimeout(
        () => {
          stop = start()
        },
        600
      )
    }
  })

  return () => {
    stop && stop()
    unsub()
  }
}

