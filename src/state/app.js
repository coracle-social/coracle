import {writable, get} from 'svelte/store'
import {navigate} from "svelte-routing"
import {globalHistory} from "svelte-routing/src/history"
import {getLocalJson, setLocalJson, now, timedelta} from "src/util/misc"
import relay from 'src/relay'

// Keep track of our user

export const user = writable(getLocalJson("coracle/user"))

user.subscribe($user => {
  setLocalJson("coracle/user", $user)

  // Keep nostr in sync
  if ($user?.privkey) {
    relay.pool.setPrivateKey($user.privkey)
  } else if ($user?.pubkey) {
    relay.pool.setPublicKey($user.pubkey)
  }
})

const userLq = relay.lq(() => {
  const $user = get(user)

  if ($user) {
    return relay.db.people.where('pubkey').equals($user?.pubkey).first()
  }
})

userLq.subscribe(person => {
  user.update($user => $user ? ({...$user, ...person}) : null)
})

// Keep track of which relays we're subscribed to

export const relays = writable(getLocalJson("coracle/relays") || [])

let prevRelays = []

relays.subscribe($relays => {
  prevRelays.forEach(url => {
    if (!$relays.includes(url)) {
      relay.pool.removeRelay(url)
    }
  })

  $relays.forEach(url => {
    if (!prevRelays.includes(url)) {
      relay.pool.addRelay(url)
    }
  })

  setLocalJson("coracle/relays", $relays)

  relay.pool.sync(get(user))
})

// Modals

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

// Settings, alerts, etc

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

// Relays

const defaultRelays = [
  "wss://nostr.zebedee.cloud",
  "wss://nostr-pub.wellorder.net",
  "wss://relay.damus.io",
  "wss://relay.grunch.dev",
  "wss://nostr.sandwich.farm",
  "wss://relay.nostr.ch",
  "wss://nostr-relay.wlvs.space",
]

export const registerRelay = async url => {
  const {dufflepudUrl} = get(settings)

  let json
  try {
    const res = await fetch(dufflepudUrl + '/relay/info', {
      method: 'POST',
      body: JSON.stringify({url}),
      headers: {
        'Content-Type': 'application/json',
      },
    })

    json = await res.json()
  } catch (e) {
    json = {}
  }

  relay.db.relays.put({...json, url})
}

for (const url of defaultRelays) {
  registerRelay(url)
}
