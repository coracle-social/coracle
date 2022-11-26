import {writable} from 'svelte/store'
import {debounce} from 'throttle-debounce'
import {relayPool, getPublicKey} from 'nostr-tools'
import {last} from 'ramda'
import {first} from 'hurdak/lib/hurdak'
import {getLocalJson, setLocalJson} from "src/util/misc"

export const nostr = relayPool()

// Track who is subscribing, so we don't go over our limit

const channel = name => {
  let active = false
  let promise = Promise.resolve('init')

  const _chan = {
    sub: params => {
      if (active) {
        throw new Error(`Channel ${name} is already active.`)
      }

      active = true

      const sub = nostr.sub(params)

      return () => {
        active = false

        sub.unsub()
      }
    },
    all: filter => {
      // Wait for any other subscriptions to finish
      promise = promise.then(() => {
        return new Promise(resolve => {
          // Collect results
          let result = []

          // As long as events are coming in, don't resolve. When
          // events are no longer streaming, resolve and close the subscription
          const done = debounce(300, () => {
            unsub()

            resolve(result)
          })

          // Create our usbscription, every time we get an event, attempt to complete
          const unsub = _chan.sub({
            filter,
            cb: e => {
              result.push(e)

              done()
            },
          })

          // If our filter doesn't match anything, be sure to resolve the promise
          setTimeout(done, 1000)
        })
      })

      return promise
    },
    first: async filter => {
      return first(await channels.getter.all({...filter, limit: 1}))
    },
    last: async filter => {
      return last(await channels.getter.all({...filter}))
    },
  }

  return _chan
}

export const channels = {
  watcher: channel('main'),
  getter: channel('getter'),
}

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
