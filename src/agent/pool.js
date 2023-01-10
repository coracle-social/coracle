import {relayInit} from 'nostr-tools'
import {uniqBy, filter, identity, prop} from 'ramda'
import {ensurePlural} from 'hurdak/lib/hurdak'

const relays = {}

const init = url => {
  const relay = relayInit(url)

  relay.url = url
  relay.stats = {
    count: 0,
    timer: 0,
    timeouts: 0,
    activeCount: 0,
  }

  relay.on('error', () => {
    console.log(`failed to connect to ${url}`)
  })

  relay.on('disconnect', () => {
    delete relays[url]
  })

  // Do initialization synchonously and wait on retrieval
  // so we don't open multiple connections simultaneously
  return relay.connect().then(
    () => relay,
    e => console.log(`Failed to connect to ${url}: ${e}`)
  )
}

const connect = url => {
  if (!relays[url]) {
    relays[url] = init(url)
  }

  return relays[url]
}

const publish = async (urls, event) => {
  return Promise.all(
    urls.map(async url => {
      const relay = await connect(url)

      if (relay) {
        return relay.publish(event)
      }
    })
  )
}

const subscribe = async (urls, filters) => {
  const subs = filter(identity, await Promise.all(
    urls.map(async url => {
      const relay = await connect(url)

      // If the relay failed to connect, give up
      if (!relay) {
        return null
      }

      const sub = relay.sub(ensurePlural(filters))

      sub.relay = relay
      sub.relay.stats.activeCount += 1

      if (sub.relay.stats.activeCount > 10) {
        console.warn(`Relay ${url} has >10 active subscriptions`)
      }

      return sub
    })
  ))

  const seen = new Set()

  return {
    unsub: () => {
      subs.forEach(sub => {
        sub.unsub()
        sub.relay.stats.activeCount -= 1
      })
    },
    onEvent: cb => {
      subs.forEach(sub => {
        sub.on('event', e => {
          if (!seen.has(e.id)) {
            e.seen_on = sub.relay.url
            seen.add(e.id)
            cb(e)
          }
        })
      })
    },
    onEose: cb => {
      subs.forEach(sub => {
        sub.on('eose', () => cb(sub.relay.url))
      })
    },
  }
}

const request = (urls, filters) => {
  return new Promise(async resolve => {
    const subscription = await subscribe(urls, filters)
    const now = Date.now()
    const events = []
    const eose = []

    const done = () => {
      subscription.unsub()

      resolve(uniqBy(prop('id'), events))

      // Keep track of relay timeouts
      urls.forEach(async url => {
        if (!eose.includes(url)) {
          const relay = await connect(url)

          // Relay may be undefined if we failed to connect
          if (relay) {
            relay.stats.count += 1
            relay.stats.timer += Date.now() - now
            relay.stats.timeouts += 1
          }
        }
      })
    }

    subscription.onEvent(e => events.push(e))

    subscription.onEose(async url => {
      const relay = await relays[url]

      eose.push(url)

      // Keep track of relay timing stats
      relay.stats.count += 1
      relay.stats.timer += Date.now() - now

      if (eose.length === urls.length) {
        done()
      }
    })

    // If a relay takes too long, give up
    setTimeout(done, 5000)
  })
}

export default {relays, connect, publish, subscribe, request}
