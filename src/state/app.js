import {writable, get} from 'svelte/store'
import {navigate} from "svelte-routing"
import {globalHistory} from "svelte-routing/src/history"
import {getLocalJson, setLocalJson, now, timedelta} from "src/util/misc"
import relay from 'src/relay'

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

// Populate relays initially. Hardcode some, load the rest asynchronously

fetch(get(settings).dufflepudUrl + '/relay').then(async r => {
  try {
    const {relays} = await r.json()

    for (const url of relays) {
      relay.db.relays.put({url})
    }
  } catch (e) {
    return
  }
})

const defaultRelays = [
  'wss://no.contry.xyz',
  'wss://nostr.ethtozero.fr',
  'wss://relay.nostr.ro',
  'wss://nostr.actn.io',
  'wss://relay.realsearch.cc',
  'wss://nostr.mrbits.it',
  'wss://relay.nostr.vision',
  'wss://nostr.massmux.com',
  'wss://nostr.robotechy.com',
  'wss://satstacker.cloud',
  'wss://relay.kronkltd.net',
  'wss://nostr.developer.li',
  'wss://nostr.vulpem.com',
  'wss://nostr.openchain.fr',
  'wss://nostr-01.bolt.observer',
  'wss://nostr.oxtr.dev',
  'wss://nostr.zebedee.cloud',
  'wss://nostr-verif.slothy.win',
  'wss://nostr.rewardsbunny.com',
  'wss://nostr.onsats.org',
  'wss://relay.boring.surf',
  'wss://no.str.watch',
  'wss://relay.nostr.pro',
  'wss://nostr.ono.re',
  'wss://nostr.rocks',
  'wss://btc.klendazu.com',
  'wss://nostr-relay.untethr.me',
  'wss://nostr.orba.ca',
  'wss://sg.qemura.xyz',
  'wss://nostr.hyperlingo.com',
  'wss://nostr.d11n.net',
  'wss://relay.nostr.express',
]

for (const url of defaultRelays) {
   relay.db.relays.put({url})
}
