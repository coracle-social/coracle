import {is, pick, identity} from "ramda"
import {ensurePlural, chunk} from "hurdak/lib/hurdak"
import {sleep, tryJson} from "src/util/misc"
import {Tags, roomAttrs, isRelay, normalizeRelayUrl} from "src/util/nostr"
import {userEvents, rooms} from "src/agent/db"
import {uniqByUrl} from "src/agent/relays"
import keys from "src/system/keys"
import user from "src/agent/user"

const handlers = {} as Record<any, any[]>

const addHandler = (kind, f) => {
  handlers[kind] = handlers[kind] || []
  handlers[kind].push(f)
}

const processEvents = async events => {
  const userPubkey = keys.getPubkey()
  const chunks = chunk(100, ensurePlural(events).filter(identity))

  for (let i = 0; i < chunks.length; i++) {
    for (const event of chunks[i]) {
      if (event.pubkey === userPubkey) {
        userEvents.patch(event)
      }

      for (const handler of handlers[event.kind] || []) {
        await handler(event)
      }

      for (const handler of handlers.ALL_KINDS || []) {
        await handler(event)
      }
    }

    // Don't lock up the ui when processing a lot of events
    if (i < chunks.length - 1) {
      await sleep(30)
    }
  }
}

// User profile, except for events also handled for other users

const userHandler = cb => e => {
  if (e.pubkey === keys.getPubkey()) {
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

export default {processEvents, addHandler}
