import {is, uniq, prop, reject, nth, uniqBy, objOf, pick, identity} from "ramda"
import {nip05} from "nostr-tools"
import {noop, ensurePlural, chunk} from "hurdak/lib/hurdak"
import {
  hexToBech32,
  tryFunc,
  bech32ToHex,
  tryFetch,
  now,
  sleep,
  tryJson,
  timedelta,
  hash,
} from "src/util/misc"
import {Tags, roomAttrs, isRelay, isShareableRelay, normalizeRelayUrl} from "src/util/nostr"
import {topics, people, userEvents, relays, rooms, routes} from "src/agent/db"
import {uniqByUrl} from "src/agent/relays"
import keys from "src/agent/keys"
import user from "src/agent/user"

const handlers = {}

const addHandler = (kind, f) => {
  handlers[kind] = handlers[kind] || []
  handlers[kind].push(f)
}

const processEvents = async events => {
  const userPubkey = user.getPubkey()
  const chunks = chunk(100, ensurePlural(events).filter(identity))

  for (let i = 0; i < chunks.length; i++) {
    for (const event of chunks[i]) {
      if (event.pubkey === userPubkey) {
        userEvents.patch(event)
      }

      for (const handler of handlers[event.kind] || []) {
        await handler(event)
      }
    }

    // Don't lock up the ui when processing a lot of events
    if (i < chunks.length - 1) {
      await sleep(30)
    }
  }
}

// People

const updatePerson = (pubkey, data) => {
  people.patch({pubkey, updated_at: now(), ...data})

  // If our pubkey matches, copy to our user's profile as well
  if (pubkey === user.getPubkey()) {
    user.profile.update($p => ({...$p, ...data}))
  }
}

const verifyNip05 = (pubkey, alias) =>
  nip05.queryProfile(alias).then(result => {
    if (result?.pubkey === pubkey) {
      updatePerson(pubkey, {verified_as: alias})

      if (result.relays?.length > 0) {
        const urls = result.relays.filter(isRelay)

        relays.patch(urls.map(url => ({url: normalizeRelayUrl(url)})))

        urls.forEach(url => {
          addRoute(pubkey, url, "nip05", "write", now())
          addRoute(pubkey, url, "nip05", "read", now())
        })
      }
    }
  }, noop)

const verifyZapper = async (pubkey, address) => {
  let url

  // Try to parse it as a lud06 LNURL or as a lud16 address
  if (address.startsWith("lnurl1")) {
    url = tryFunc(() => bech32ToHex(address))
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
  const lnurl = hexToBech32("lnurl", url)

  if (zapper?.allowsNostr && zapper?.nostrPubkey) {
    updatePerson(pubkey, {
      lnurl,
      // Trim zapper so we don't have so much metadata filling up memory
      zapper: pick(["callback", "maxSendable", "minSendable", "nostrPubkey"], zapper),
    })
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

    updatePerson(e.pubkey, {
      kind0: {...person?.kind0, ...kind0},
      kind0_updated_at: e.created_at,
    })
  })
})

addHandler(3, e => {
  const person = people.get(e.pubkey)

  if (e.created_at < person?.petnames_updated_at) {
    return
  }

  updatePerson(e.pubkey, {
    petnames_updated_at: e.created_at,
    petnames: e.tags.filter(t => t[0] === "p"),
  })
})

// User profile, except for events also handled for other users

const userHandler = cb => e => {
  if (e.pubkey === user.getPubkey()) {
    cb(e)
  }
}

const profileHandler = (key, getValue) =>
  userHandler(async e => {
    const profile = user.getProfile()
    const updated_at_key = `${key}_updated_at`

    if (e.created_at < profile?.[updated_at_key]) {
      return
    }

    const value = await getValue(e, profile)

    // If we didn't get a value, don't update the key
    if (value) {
      user.profile.set({...profile, [key]: value, [updated_at_key]: e.created_at})
    }
  })

addHandler(
  2,
  profileHandler("relays", (e, p) => uniqByUrl(p.relays.concat({url: e.content})))
)

addHandler(
  3,
  profileHandler("relays", (e, p) => {
    return tryJson(() => {
      return Object.entries(JSON.parse(e.content))
        .map(([url, conditions]) => {
          const {write, read} = conditions as Record<string, boolean | string>

          return {
            url: normalizeRelayUrl(url),
            write: [false, "!"].includes(write) ? false : true,
            read: [false, "!"].includes(read) ? false : true,
          }
        })
        .filter(r => isRelay(r.url))
    })
  })
)

addHandler(
  10000,
  profileHandler("mutes", (e, p) => e.tags)
)

// DEPRECATED
addHandler(
  10001,
  profileHandler("relays", (e, p) => {
    return e.tags.map(([url, read, write]) => ({url, read: read !== "!", write: write !== "!"}))
  })
)

addHandler(
  10002,
  profileHandler("relays", (e, p) => {
    return Tags.from(e)
      .type("r")
      .all()
      .map(([_, url, mode]) => {
        const read = (mode || "read") === "read"
        const write = (mode || "write") === "write"

        return {url, read, write}
      })
  })
)

addHandler(
  30001,
  profileHandler("lists", (e, p) => uniqBy(prop("id"), p.lists.concat(e)))
)

addHandler(
  5,
  profileHandler("lists", (e, p) => {
    const ids = new Set(Tags.from(e).type("e").values().all())

    return reject(e => ids.has(e.id), p.lists)
  })
)

addHandler(
  30078,
  profileHandler("settings", async (e, p) => {
    if (Tags.from(e).getMeta("d") === "coracle/settings/v1") {
      return {...p.settings, ...(await keys.decryptJson(e.content))}
    }
  })
)

addHandler(
  30078,
  profileHandler("last_checked", async (e, p) => {
    if (Tags.from(e).getMeta("d") === "coracle/last_checked/v1") {
      try {
        const payload = await keys.decryptJson(e.content)
        const updates = {}
        for (const k of Object.keys(payload).concat(p.last_checked)) {
          const v = Math.max(payload[k] || 0, p.last_checked[k] || 0)

          // A bunch of junk got added to this setting. Integer keys, settings, etc
          if (isNaN(v) || v < 1577836800) {
            continue
          }

          updates[k] = v
        }

        return updates
      } catch (e) {
        // pass
      }
    }
  })
)

addHandler(
  30078,
  profileHandler("rooms_joined", async (e, p) => {
    if (Tags.from(e).getMeta("d") === "coracle/rooms_joined/v1") {
      const roomsJoined = await keys.decryptJson(e.content)

      // Just a bug from when I was building the feature, remove someday
      if (is(Array, roomsJoined)) {
        return roomsJoined
      }
    }
  })
)

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
  const roomId = Tags.from(e).getMeta("e")

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

    routes.patch({
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

// Topics

const processTopics = e => {
  const matches = Array.from(e.content.toLowerCase().matchAll(/#(\w{2,100})/g))

  if (matches.length > 0) {
    topics.patch(matches.map(nth(1)).map(objOf("name")))
  }
}

addHandler(1, processTopics)
addHandler(42, processTopics)

export default {processEvents}
