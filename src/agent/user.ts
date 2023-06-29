import type {Relay, MyEvent} from "src/util/types"
import type {Readable} from "svelte/store"
import {slice, uniqBy, without, reject, prop, pipe, assoc, whereEq, when, concat, map} from "ramda"
import {findReplyId, findRootId} from "src/util/nostr"
import {synced} from "src/util/misc"
import {derived, get} from "svelte/store"
import keys from "src/system/keys"
import pool from "src/agent/pool"
import cmd from "src/agent/cmd"

const profile = synced("agent/user/profile", {
  pubkey: null,
  kind0: null,
  lnurl: null,
  zapper: null,
  rooms_joined: [],
  last_checked: {},
  relays: pool.defaultRelays,
  mutes: [],
  lists: [],
})

const roomsJoined = derived(profile, prop("rooms_joined")) as Readable<string>
const lastChecked = derived(profile, prop("last_checked")) as Readable<Record<string, number>>
const relays = derived(profile, p =>
  pool.forceRelays.length > 0 ? pool.forceRelays : p.relays
) as Readable<Array<Relay>>
const mutes = derived(profile, prop("mutes")) as Readable<Array<[string, string]>>
const lists = derived(profile, prop("lists")) as Readable<Array<MyEvent>>

// Keep a copy so we can avoid calling `get` all the time

let profileCopy = null

profile.subscribe($profile => {
  profileCopy = $profile
})

// Watch pubkey and add to profile

keys.pubkey.subscribe($pubkey => {
  if ($pubkey) {
    profile.update($p => ({...$p, pubkey: $pubkey}))
  }
})

export default {
  // Profile

  profile,
  getProfile: () => profileCopy,
  getPubkey: () => profileCopy?.pubkey,

  // App data

  lastChecked,
  roomsJoined,
  async setAppData(key, content) {
    if (get(keys.canSign)) {
      const d = `coracle/${key}`
      const v = await keys.encryptJson(content)

      return cmd.setAppData(d, v).publish(profileCopy.relays)
    }
  },
  setLastChecked(k, v) {
    this.setAppData("last_checked/v1", {...profileCopy.last_checked, [k]: v})
  },
  joinRoom(id) {
    this.setAppData("rooms_joined/v1", profileCopy.rooms_joined.concat(id))
  },
  leaveRoom(id) {
    this.setAppData("rooms_joined/v1", without([id], profileCopy.rooms_joined))
  },

  // Relays

  relays,
  getRelays: () => profileCopy.relays,
  updateRelays(f) {
    const $relays = uniqBy(prop("url"), f(profileCopy.relays))

    profile.update(assoc("relays", $relays))

    if (get(keys.canSign)) {
      return cmd.setRelays($relays).publish($relays)
    }
  },
  addRelay(url) {
    return this.updateRelays($relays => $relays.concat({url, write: true, read: true}))
  },
  removeRelay(url) {
    return this.updateRelays(reject(whereEq({url})))
  },
  setRelayWriteCondition(url, write) {
    return this.updateRelays(map(when(whereEq({url}), assoc("write", write))))
  },

  // Mutes

  mutes,
  getMutes: () => profileCopy.mutes,
  applyMutes: events => {
    const m = new Set(profileCopy.mutes.map(m => m[1]))

    return events.filter(
      e => !(m.has(e.id) || m.has(e.pubkey) || m.has(findReplyId(e)) || m.has(findRootId(e)))
    )
  },
  updateMutes(f) {
    const $mutes = f(profileCopy.mutes)

    profile.update(assoc("mutes", $mutes))

    if (get(keys.canSign)) {
      return cmd.setMutes($mutes.map(slice(0, 2))).publish(profileCopy.relays)
    }
  },
  addMute(type, value) {
    return this.updateMutes(
      pipe(
        reject(t => t[1] === value),
        concat([[type, value]])
      )
    )
  },
  removeMute(pubkey) {
    return this.updateMutes(reject(t => t[1] === pubkey))
  },

  // Lists

  lists,
  getLists: () => profileCopy.lists,
  async putList(id, name, params, relays) {
    const tags = [["d", name]].concat(params).concat(relays)

    if (id) {
      await cmd.deleteEvent([id]).publish(profileCopy.relays)
    }

    await cmd.createList(tags).publish(profileCopy.relays)
  },
  removeList(id) {
    return cmd.deleteEvent([id]).publish(profileCopy.relays)
  },
}
