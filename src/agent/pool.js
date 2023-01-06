import {relayInit} from 'nostr-tools'
import {partial, uniqBy, prop} from 'ramda'
import {ensurePlural} from 'hurdak/lib/hurdak'

const relays = {}

const connect = async url => {
  if (!relays[url]) {
    relays[url] = relayInit(url)
    relays[url].url = url
    relays[url].stats = {
      count: 0,
      timer: 0,
      timeouts: 0,
      activeCount: 0,
    }

    relays[url].on('disconnect', () => {
      delete relays[url]
    })

    relays[url].connected = relays[url].connect()
  }

  await relays[url].connected

  return relays[url]
}

const publish = (urls, event) => {
  urls.forEach(async url => {
    const relay = await connect(url)

    relay.publish(event)
  })
}

const sub = async (urls, filters) => {
  const subs = await Promise.all(
    urls.map(async url => {
      const relay = await connect(url)
      const sub = relay.sub(ensurePlural(filters))

      sub.relay = relay
      sub.relay.stats.activeCount += 1

      if (sub.relay.stats.activeCount > 10) {
        console.warning(`Relay ${url} has >10 active subscriptions`)
      }

      return sub
    })
  )

  return {
    unsub: () => {
      subs.forEach(sub => {
        sub.unsub()
        sub.relay.stats.activeCount -= 1
      })
    },
    on: (type, cb) => {
      subs.forEach(sub => {
        sub.on(type, partial(cb, [sub.relay.url]))
      })
    },
  }
}

const all = (urls, filters) => {
  return new Promise(async resolve => {
    const subscription = await sub(urls, filters)
    const now = Date.now()
    const events = []
    const eose = []

    const done = () => {
      resolve(uniqBy(prop('id'), events))

      // Keep track of relay timeouts
      urls.forEach(url => {
        if (!eose.includes(url)) {
          relays[url].stats.count += 1
          relays[url].stats.timer += Date.now() - now
          relays[url].stats.timeouts += 1
        }
      })
    }

    subscription.on('event', (url, e) => events.push(e))

    subscription.on('eose', url => {
      eose.push(url)

      // Keep track of relay timing stats
      relays[url].stats.count += 1
      relays[url].stats.timer += Date.now() - now

      if (eose.length === urls.length) {
        done()
      }
    })

    // If a relay takes too long, give up
    setTimeout(done, 5000)
  })
}

export default {relays, connect, publish, sub, all}
