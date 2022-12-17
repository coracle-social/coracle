import {uniqBy, prop} from 'ramda'
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

// Keep track of known relays

export const knownRelays = writable((getLocalJson("coracle/knownRelays") || [
  {url: "wss://nostr-pub.wellorder.net"},
  {url: "wss://nostr.rocks"},
  {url: "wss://nostr-pub.semisol.dev"},
  {url: "wss://nostr.drss.io"},
  {url: "wss://relay.damus.io"},
  {url: "wss://nostr.openchain.fr"},
  {url: "wss://nostr.delo.software"},
  {url: "wss://relay.nostr.info"},
  {url: "wss://nostr.ono.re"},
  {url: "wss://relay.grunch.dev"},
  {url: "wss://nostr.sandwich.farm"},
  {url: "wss://relay.nostr.ch"},
  {url: "wss://nostr-relay.wlvs.space"},
]).filter(x => x.url))

knownRelays.subscribe($knownRelays => {
  setLocalJson("coracle/knownRelays", $knownRelays)
})

export const registerRelay = async url => {
  let json
  try {
    const res = await fetch(url.replace(/^ws/, 'http'), {
      headers: {
        Accept: 'application/nostr_json',
      },
    })

    json = await res.json()
  } catch (e) {
    json = {}
  }

  knownRelays.update($xs => uniqBy(prop('url'), $xs.concat({...json, url})))
}

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
