import type {Relay} from "src/util/types"
import type {Readable} from "svelte/store"
import {slice, prop, find, pipe, assoc, whereEq, when, concat, reject, nth, map} from "ramda"
import {findReplyId, findRootId} from "src/util/nostr"
import {synced} from "src/util/misc"
import {derived} from "svelte/store"
import keys from "src/agent/keys"
import cmd from "src/agent/cmd"

const profile = synced("agent/user/profile", {
  pubkey: null,
  kind0: null,
  lnurl: null,
  zapper: null,
  settings: {
    relayLimit: 20,
    defaultZap: 21,
    showMedia: true,
    reportAnalytics: true,
    dufflepudUrl: import.meta.env.VITE_DUFFLEPUD_URL,
  },
  petnames: [],
  relays: [],
  mutes: [],
})

const settings = derived(profile, prop("settings"))
const petnames = derived(profile, prop("petnames"))
const relays = derived(profile, prop("relays")) as Readable<Array<Relay>>
const mutes = derived(profile, prop("mutes"))

const canPublish = derived(
  [keys.pubkey, relays],
  ([$pubkey, $relays]) => keys.canSign() && find(prop("write"), $relays)
)

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
  canPublish,
  getProfile: () => profileCopy,
  getPubkey: () => profileCopy?.pubkey,

  // Settings

  settings,
  getSettings: () => profileCopy.settings,
  getSetting: k => profileCopy.settings[k],
  dufflepud: path => `${profileCopy.settings.dufflepudUrl}${path}`,

  // Petnames

  petnames,
  getPetnames: () => profileCopy.petnames,
  petnamePubkeys: derived(petnames, map(nth(1))) as Readable<Array<string>>,
  updatePetnames(f) {
    const $petnames = f(profileCopy.petnames)

    profile.update(assoc("petnames", $petnames))

    if (keys.canSign()) {
      return cmd.setPetnames($petnames).publish(profileCopy.relays)
    }
  },
  addPetname(pubkey, url, name) {
    const tag = ["p", pubkey, url, name || ""]

    return this.updatePetnames(
      pipe(
        reject(t => t[1] === pubkey),
        concat([tag])
      )
    )
  },
  removePetname(pubkey) {
    return this.updatePetnames(reject(t => t[1] === pubkey))
  },

  // Relays

  relays,
  getRelays: () => profileCopy.relays,
  updateRelays(f) {
    const $relays = f(profileCopy.relays)

    profile.update(assoc("relays", $relays))

    if (keys.canSign()) {
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

    if (keys.canSign()) {
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
}
