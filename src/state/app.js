import {prop, sortBy, uniqBy, find, last, groupBy} from 'ramda'
import {debounce} from 'throttle-debounce'
import {writable, derived, get} from 'svelte/store'
import {switcherFn, ensurePlural} from 'hurdak/lib/hurdak'
import {getLocalJson, setLocalJson, now, timedelta} from "src/util/misc"
import {user} from 'src/state/user'
import {channels} from 'src/state/nostr'

export const modal = writable(null)

export const rooms = writable(getLocalJson("coracle/rooms") || {})

rooms.subscribe($rooms => {
  setLocalJson("coracle/rooms", $rooms)
})

export const accounts = writable(getLocalJson("coracle/accounts") || {})

accounts.subscribe($accounts => {
  setLocalJson("coracle/accounts", $accounts)
})

user.subscribe($user => {
  if ($user) {
    accounts.update($accounts => ({...$accounts, [$user.pubkey]: $user}))
  }
})

// Utils

export const ensureAccount = pubkey => {
  let $account = prop(pubkey, get(accounts))

  if (!$account || $account.lastRefreshed < now() - timedelta(10, 'minutes')) {
    channels.getter.sub({
      filter: {kinds: [0], authors: [pubkey]},
      cb: e => {
        $account = {
          ...$account,
          ...JSON.parse(e.content),
          pubkey,
          lastRefreshed: now(),
        }

        accounts.update($accounts => ({...$accounts, [pubkey]: $account}))
      },
    })
  }
}

export const findNotes = (channel, queries, cb) => {
  const notes = writable([])
  const reactions = writable([])

  channel.sub({
    filter: ensurePlural(queries).map(q => ({kinds: [1, 5, 7], ...q})),
    cb: async e => {
      switcherFn(e.kind, {
        1: () => {
          notes.update($xs => uniqBy(prop('id'), $xs.concat(e)))

          ensureAccount(e.pubkey)
        },
        5: () => {
          const ids = e.tags.map(t => t[1])

          notes.update($xs => $xs.filter(({id}) => !id.includes(ids)))
          reactions.update($xs => $xs.filter(({id}) => !id.includes(ids)))
        },
        7: () => {
          reactions.update($xs => $xs.concat(e))

          ensureAccount(e.pubkey)
        },
      })

      ensureAccount(e.pubkey)
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

  return annotatedNotes.subscribe(debounce(300, cb))
}
