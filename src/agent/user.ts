import type {Relay} from "src/util/types"
import type {Readable} from "svelte/store"
import {uniqBy, without, reject, prop, assoc, whereEq, when, map} from "ramda"
import {synced} from "src/util/misc"
import {derived, get} from "svelte/store"
import keys from "src/system/keys"
import pool from "src/agent/pool"

const ext = {cmd: null}

const profile = synced("agent/user/profile", {
  pubkey: null,
  kind0: null,
  lnurl: null,
  rooms_joined: [],
  last_checked: {},
  relays: pool.defaultRelays,
})

const roomsJoined = derived(profile, prop("rooms_joined")) as Readable<string>
const lastChecked = derived(profile, prop("last_checked")) as Readable<Record<string, number>>
const relays = derived(profile, p =>
  pool.forceRelays.length > 0 ? pool.forceRelays : p.relays
) as Readable<Array<Relay>>

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
  ext,

  // Profile

  profile,
  getProfile: () => profileCopy,

  // App data

  lastChecked,
  roomsJoined,
  async setAppData(key, content) {
    if (get(keys.canSign)) {
      const d = `coracle/${key}`
      const v = await keys.encryptJson(content)

      return ext.cmd.setAppData(d, v).publish(profileCopy.relays)
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
      return ext.cmd.setRelays($relays).publish($relays)
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
}
