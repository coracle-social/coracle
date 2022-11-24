import {writable} from 'svelte/store'
import {relayPool, getPublicKey} from 'nostr-tools'
import {getLocalJson, setLocalJson} from "src/util/misc"

export const nostr = relayPool()

// Augment nostr with some extra methods

nostr.login = privkey => {
  nostr.setPrivateKey(privkey)
  nostr._privkey = privkey
}

nostr.event = (kind, content = '', tags = []) => {
  const pubkey = getPublicKey(nostr._privkey)
  const createdAt = Math.round(new Date().valueOf() / 1000)

  return {kind, content, tags, pubkey, created_at: createdAt}
}

nostr.find = (filter, timeout = 300) => {
  return new Promise(resolve => {
    const sub = nostr.sub({
      filter,
      cb: e => {
        resolve(e)

        sub.unsub()
      },
    })

    setTimeout(() => {
      resolve(null)

      sub.unsub()
    }, timeout)
  })
}

nostr.findLast = (filter, timeout = 300) => {
  return new Promise(resolve => {
    let result = null

    const sub = nostr.sub({
      filter,
      cb: e => {
        result = e
      },
    })

    setTimeout(() => {
      resolve(result)

      sub.unsub()
    }, timeout)
  })
}

// Create writable store for relays so we can observe changes in the app

export const relays = writable(getLocalJson("coracle/relays") || [])

relays.subscribe($relays => {
  Object.keys(nostr.relays).forEach(url => {
    if (!$relays.includes(url)) {
      nostr.removeRelay(url)
    }
  })

  $relays.forEach(url => {
    if (!nostr.relays[url]) {
      nostr.addRelay(url)
    }
  })

  setLocalJson("coracle/relays", $relays)
})
