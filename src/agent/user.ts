import type {Readable} from "svelte/store"
import {without, prop} from "ramda"
import {synced} from "src/util/misc"
import {derived, get} from "svelte/store"
import keys from "src/system/keys"

const ext = {cmd: null}

const profile = synced("agent/user/profile", {
  pubkey: null,
  kind0: null,
  lnurl: null,
  rooms_joined: [],
  last_checked: {},
})

const roomsJoined = derived(profile, prop("rooms_joined")) as Readable<string>
const lastChecked = derived(profile, prop("last_checked")) as Readable<Record<string, number>>

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
}
