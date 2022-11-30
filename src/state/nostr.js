import {writable} from 'svelte/store'
import {relayPool, getPublicKey} from 'nostr-tools'
import {last, intersection, uniqBy, prop} from 'ramda'
import {first, noop, ensurePlural} from 'hurdak/lib/hurdak'
import {getLocalJson, setLocalJson, now, timedelta} from "src/util/misc"

export const nostr = relayPool()

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

// Support the deprecated version where tags are marked as replies
export const findReplyTo = e =>
  findTag({tag: "e", type: "reply"}, e) || findTag({tag: "e"}, e)

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

    let resolve
    const sub = nostr.sub({filter, cb}, this.name, r => {
      onEose(r)

      resolve()
    })

    this.p = new Promise(r => {
      resolve = r
    })

    return sub
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

          resolve(result)
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
  constructor(filter, delta = timedelta(1, 'hours')) {
    this.filter = ensurePlural(filter)
    this.delta = delta
    this.since = now() - delta
    this.until = now()
    this.sub = null
    this.q = []
    this.p = Promise.resolve()
  }
  async start() {
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
  restart() {
    this.stop()
    this.start()
  }
  step() {
    this.since -= this.delta
    this.restart()
  }
  onEvent(e) {
    this.until = e.created_at - 1
    this.q.push(e)
  }
  onEose() {
    this.stop()
  }
  async chunk() {
    this.step()

    /* eslint no-constant-condition: 0 */
    while (true) {
      await new Promise(requestAnimationFrame)

      if (!this.sub) {
        return this.q.splice(0)
      }
    }
  }
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
