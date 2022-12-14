import {writable, get} from 'svelte/store'
import {relayPool, getPublicKey} from 'nostr-tools'
import {assoc, last, find, intersection, uniqBy, prop} from 'ramda'
import {first, noop, ensurePlural} from 'hurdak/lib/hurdak'
import {getLocalJson, setLocalJson, now, timedelta} from "src/util/misc"

export const nostr = relayPool()

export const epoch = 1633046400

export const filterTags = (where, events) =>
  ensurePlural(events)
    .flatMap(
      e => e.tags.filter(t => {
        if (where.tag && where.tag !== t[0]) {
          return false
        }

        if (where.type && where.type !== last(t)) {
          return false
        }

        return true
      }).map(t => t[1])
    )

export const findTag = (where, events) => first(filterTags(where, events))

// Support the deprecated version where tags are not marked as replies
export const findReply = e =>
  findTag({tag: "e", type: "reply"}, e) || findTag({tag: "e"}, e)

export const findRoot = e =>
  findTag({tag: "e", type: "root"}, e)

export const filterMatches = (filter, e)  => {
  return Boolean(find(
    f => {
      return (
           (!f.ids     || f.ids.includes(e.id))
        && (!f.authors || f.authors.includes(e.pubkey))
        && (!f.kinds   || f.kinds.includes(e.kind))
        && (!f['#e']   || intersection(f['#e'], e.tags.filter(t => t[0] === 'e').map(t => t[1])))
        && (!f['#p']   || intersection(f['#p'], e.tags.filter(t => t[0] === 'p').map(t => t[1])))
        && (!f.since   || f.since >= e.created_at)
        && (!f.until   || f.until <= e.created_at)
      )
    },
    ensurePlural(filter)
  ))
}

export class Channel {
  constructor(name) {
    this.name = name
    this.p = Promise.resolve()
  }
  async sub(filter, cb, onEose = noop) {
    // Make sure callers have to wait for the previous sub to be done
    // before they can get a new one.
    await this.p

    // If we don't have any relays, we'll wait forever for an eose, but
    // we already know we're done. Use a timeout since callers are
    // expecting this to be async and we run into errors otherwise.
    if (get(relays).length === 0) {
      setTimeout(onEose)

      return {unsub: noop}
    }

    let resolve
    const eoseRelays = []
    const sub = nostr.sub({filter, cb}, this.name, r => {
      eoseRelays.push(r)

      if (eoseRelays.length === get(relays).length) {
        onEose()
      }
    })

    this.p = new Promise(r => {
      resolve = r
    })

    return {
      unsub: () => {
        sub.unsub()

        resolve()
      }
    }
  }
  all(filter) {
    /* eslint no-async-promise-executor: 0 */
    return new Promise(async resolve => {
      const result = []

      const sub = await this.sub(
        filter,
        e => result.push(e),
        r => {
          sub.unsub()

          resolve(uniqBy(prop('id'), result))
        },
      )
    })
  }
}

export const channels = {
  listener: new Channel('listener'),
  getter: new Channel('getter'),
}

// We want to get old events, then listen for new events, then potentially retrieve
// older events again for pagination. Since we have to limit channels to 3 per nip 01,
// this requires us to unsubscribe and re-subscribe frequently
export class Cursor {
  constructor(filter, delta) {
    this.filter = ensurePlural(filter)
    this.delta = delta || timedelta(1, 'hours')
    this.since = now() - this.delta
    this.until = now()
    this.sub = null
    this.q = []
    this.p = Promise.resolve()
    this.seen = new Set()
  }
  async start() {
    if (!this.since) {
      throw new Error("Since must not be null")
    }

    if (!this.sub) {
      this.sub = await channels.getter.sub(
        this.filter.map(f => ({...f, since: this.since, until: this.until})),
        e => this.onEvent(e),
        r => this.onEose(r)
      )
    }
  }
  stop() {
    if (this.sub) {
      this.sub.unsub()
      this.sub = null
    }
  }
  async restart() {
    this.stop()

    await this.start()
  }
  async step() {
    this.since -= this.delta

    await this.restart()
  }
  onEvent(e) {
    // Save a little memory
    const shortId = e.id.slice(-10)

    if (!this.seen.has(shortId)) {
      this.seen.add(shortId)
      this.q.push(e)
    }

    this.until = Math.min(this.until, e.created_at - 1)
  }
  onEose() {
    this.stop()
  }
  async chunk() {
    await this.step()

    /* eslint no-constant-condition: 0 */
    while (true) {
      await new Promise(requestAnimationFrame)

      if (!this.sub) {
        return this.q.splice(0)
      }
    }
  }
}

export class Listener {
  constructor(filter, onEvent) {
    this.filter = ensurePlural(filter).map(assoc('since', now()))
    this.onEvent = onEvent
    this.since = now()
    this.sub = null
    this.q = []
    this.p = Promise.resolve()
  }
  async start() {
    const {filter, since} = this

    if (!this.sub) {
      this.sub = await channels.listener.sub(
        filter.map(f => ({since, ...f})),
        e => {
          // Not sure why since filter isn't working here, it's just slightly off
          if (e.created_at >= since) {
            this.since = e.created_at + 1
            this.onEvent(e)
          }
        }
      )
    }
  }
  stop() {
    if (this.sub) {
      this.sub.unsub()
      this.sub = null
    }
  }
  restart() {
    this.stop()
    this.start()
  }
}

// Augment nostr with some extra methods

nostr.login = privkey => {
  nostr.setPrivateKey(privkey)
  nostr._privkey = privkey
}

nostr.pubkeyLogin = pubkey => {
  nostr.registerSigningFunction( async (event) => {
    const {sig} = await window.nostr.signEvent(event)
    return sig
  })
  nostr._pubkey = pubkey
}

nostr.event = (kind, content = '', tags = []) => {
  const pubkey = nostr._pubkey || getPublicKey(nostr._privkey)
  const createdAt = Math.round(new Date().valueOf() / 1000)

  return {kind, content, tags, pubkey, created_at: createdAt}
}

// Keep track of known relays

export const knownRelays = writable(getLocalJson("coracle/knownRelays") || [])

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
