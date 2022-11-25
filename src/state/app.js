import {prop} from 'ramda'
import {writable, get} from 'svelte/store'
import {getLocalJson, setLocalJson, now, timedelta} from "src/util/misc"
import {user} from 'src/state/user'
import {nostr} from 'src/state/nostr'

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

export const ensureAccount = pubkey => {
  let $account = prop(pubkey, get(accounts))

  if (!$account || $account.lastRefreshed < now() - timedelta(10, 'minutes')) {
    const accountSub = nostr.sub({
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

    setTimeout(() => {
      accountSub.unsub()
    }, 1000)
  }
}
