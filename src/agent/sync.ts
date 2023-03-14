import {uniq, pick, identity} from "ramda"
import {nip05} from "nostr-tools"
import {noop, ensurePlural, chunk} from "hurdak/lib/hurdak"
import {
  lnurlEncode,
  tryFunc,
  lnurlDecode,
  tryFetch,
  now,
  sleep,
  tryJson,
  timedelta,
  hash,
} from "src/util/misc"
import {
  Tags,
  roomAttrs,
  isRelay,
  isShareableRelay,
  normalizeRelayUrl,
} from "src/util/nostr"
import {getPersonWithFallback, people, relays, rooms, routes} from "src/agent/state"
import {uniqByUrl} from "src/agent/relays"

const handlers = {}

const addHandler = (kind, f) => (handlers[kind] || []).push(f)

const processEvents = async events => {
  const chunks = chunk(100, ensurePlural(events))

  for (let i = 0; i < chunks.length; i++) {
    for (const event of chunks[i]) {
      for (const handler of handlers[event.kind] || []) {
        handler(event)
      }
    }

    // Don't lock up the ui when processing a lot of events
    if (i < chunks.length - 1) {
      await sleep(30)
    }
  }
}

// People

const verifyNip05 = (pubkey, as) =>
  nip05.queryProfile(as).then(result => {
    if (result?.pubkey === pubkey) {
      const person = getPersonWithFallback(pubkey)

      people.patch({...person, verified_as: as})

      if (result.relays?.length > 0) {
        const urls = result.relays.filter(isRelay)

        relays.bulkPatch(urls.map(url => ({url: normalizeRelayUrl(url)})))

        routes.bulkPut(
          urls
            .flatMap(url => [
              addRoute(pubkey, url, "nip05", "write", now()),
              addRoute(pubkey, url, "nip05", "read", now()),
            ])
            .filter(identity)
        )
      }
    }
  }, noop)

const verifyZapper = async (pubkey, address) => {
  let url

  // Try to parse it as a lud06 LNURL or as a lud16 address
  if (address.startsWith("lnurl1")) {
    url = tryFunc(() => lnurlDecode(address))
  } else if (address.includes("@")) {
    const [name, domain] = address.split("@")

    if (domain && name) {
      url = `https://${domain}/.well-known/lnurlp/${name}`
    }
  }

  if (!url) {
    return
  }

  const res = await tryFetch(() => fetch(url))
  const zapper = await tryJson(() => res?.json())
  const lnurl = lnurlEncode("lnurl", url)

  if (zapper?.allowsNostr && zapper?.nostrPubkey) {
    people.patch({pubkey, zapper, lnurl})
  }
}

addHandler(0, e => {
  tryJson(() => {
    const kind0 = JSON.parse(e.content)

    const person = people.get(e.pubkey)

    if (e.created_at < person?.kind0_updated_at) {
      return
    }

    if (kind0.nip05) {
      verifyNip05(e.pubkey, kind0.nip05)
    }

    const address = kind0.lud16 || kind0.lud06

    if (address) {
      verifyZapper(e.pubkey, address.toLowerCase())
    }

    people.patch({
      pubkey: e.pubkey,
      updated_at: now(),
      kind0: {...person?.kind0, ...kind0},
      kind0_updated_at: e.created_at,
    })
  })
})

addHandler(2, e => {
  const person = people.get(e.pubkey)

  if (e.created_at < person?.relays_updated_at) {
    return
  }

  people.patch({
    pubkey: e.pubkey,
    updated_at: now(),
    relays_updated_at: e.created_at,
    relays: uniqByUrl((person?.relays || []).concat({url: e.content})),
  })
})

addHandler(3, e => {
  const person = people.get(e.pubkey)

  if (e.created_at > (person?.petnames_updated_at || 0)) {
    people.patch({
      pubkey: e.pubkey,
      updated_at: now(),
      petnames_updated_at: e.created_at,
      petnames: e.tags.filter(t => t[0] === "p"),
    })
  }

  if (e.created_at > (person.relays_updated_at || 0)) {
    tryJson(() => {
      people.patch({
        pubkey: e.pubkey,
        relays_updated_at: e.created_at,
        relays: Object.entries(JSON.parse(e.content))
          .map(([url, conditions]) => {
            const {write, read} = conditions as Record<string, boolean | string>

            return {
              url: normalizeRelayUrl(url),
              write: [false, "!"].includes(write) ? false : true,
              read: [false, "!"].includes(read) ? false : true,
            }
          })
          .filter(r => isRelay(r.url)),
      })
    })
  }
})

addHandler(10000, e => {
  const person = people.get(e.pubkey)

  if (e.created_at < person?.mutes_updated_at) {
    return
  }

  people.patch({
    pubkey: e.pubkey,
    updated_at: now(),
    mutes_updated_at: e.created_at,
    mutes: e.tags,
  })
})

// DEPRECATED
addHandler(12165, e => {
  const person = people.get(e.pubkey)

  if (e.created_at < person?.mutes_updated_at) {
    return
  }

  people.patch({
    pubkey: e.pubkey,
    updated_at: now(),
    mutes_updated_at: e.created_at,
    mutes: e.tags,
  })
})

addHandler(10002, e => {
  const person = people.get(e.pubkey)

  if (e.created_at < person?.relays_updated_at) {
    return
  }

  people.patch({
    pubkey: e.pubkey,
    updated_at: now(),
    relays_updated_at: e.created_at,
    relays: e.tags.map(([_, url, mode]) => {
      const read = (mode || "read") === "read"
      const write = (mode || "write") === "write"

      return {url, read, write}
    }),
  })
})

// Rooms

addHandler(40, e => {
  const room = rooms.get(e.id)

  if (e.created_at < room?.updated_at) {
    return
  }

  const content = tryJson(() => pick(roomAttrs, JSON.parse(e.content)))

  if (!content?.name) {
    return
  }

  rooms.patch({
    id: e.id,
    pubkey: e.pubkey,
    updated_at: e.created_at,
    ...content,
  })
})

addHandler(41, e => {
  const roomId = Tags.from(e).type("e").values().first()

  if (!roomId) {
    return
  }

  const room = rooms.get(roomId)

  if (e.created_at < room?.updated_at) {
    return
  }

  const content = tryJson(() => pick(roomAttrs, JSON.parse(e.content)))

  if (!content?.name) {
    return
  }

  rooms.patch({
    id: roomId,
    pubkey: e.pubkey,
    updated_at: e.created_at,
    ...content,
  })
})

// Routes

const getWeight = type => {
  if (type === "nip05") return 1
  if (type === "kind:10002") return 1
  if (type === "kind:3") return 0.8
  if (type === "kind:2") return 0.5
}

const addRoute = (pubkey, rawUrl, type, mode, created_at) => {
  if (!isShareableRelay(rawUrl)) {
    return
  }

  const url = normalizeRelayUrl(rawUrl)
  const id = hash([pubkey, url, mode].join("")).toString()
  const score = getWeight(type) * (1 - (now() - created_at) / timedelta(30, "days"))
  const defaults = {id, pubkey, url, mode, score: 0, count: 0, types: []}
  const route = routes.get(id) || defaults

  const newTotalScore = route.score * route.count + score
  const newCount = route.count + 1

  if (score > 0) {
    relays.patch({
      url: route.url,
    })

    routes.put({
      ...route,
      count: newCount,
      score: newTotalScore / newCount,
      types: uniq(route.types.concat(type)),
      last_seen: Math.max(created_at, route.last_seen || 0),
    })
  }
}

addHandler(2, e => {
  addRoute(e.pubkey, e.content, "kind:2", "read", e.created_at)
  addRoute(e.pubkey, e.content, "kind:2", "write", e.created_at)
})

addHandler(3, e => {
  tryJson(() => {
    Object.entries(JSON.parse(e.content || "")).forEach(([url, conditions]) => {
      const {write, read} = conditions as Record<string, boolean | string>

      if (![false, "!"].includes(write)) {
        addRoute(e.pubkey, url, "kind:3", "write", e.created_at)
      }

      if (![false, "!"].includes(read)) {
        addRoute(e.pubkey, url, "kind:3", "read", e.created_at)
      }
    })
  })
})

addHandler(10002, e => {
  e.tags.forEach(([_, url, mode]) => {
    if (mode) {
      addRoute(e.pubkey, url, "kind:10002", mode, e.created_at)
    } else {
      addRoute(e.pubkey, url, "kind:10002", "read", e.created_at)
      addRoute(e.pubkey, url, "kind:10002", "write", e.created_at)
    }
  })
})

export default {processEvents}
