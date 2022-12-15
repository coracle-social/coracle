import {uniq} from 'ramda'
import {writable, get} from 'svelte/store'
import {navigate} from "svelte-routing"
import {globalHistory} from "svelte-routing/src/history"
import {switcherFn} from 'hurdak/lib/hurdak'
import {getLocalJson, setLocalJson, now, timedelta} from "src/util/misc"
import {user} from 'src/state/user'
import {channels, relays} from 'src/state/nostr'

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

export const alerts = writable({
  since: now() - timedelta(30, 'days'),
  ...getLocalJson("coracle/alerts"),
})

alerts.subscribe($alerts => {
  setLocalJson("coracle/alerts", $alerts)
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
