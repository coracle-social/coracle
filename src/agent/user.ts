import type {Person} from 'src/util/types'
import type {Readable} from 'svelte/store'
import {slice, identity, prop, find, pipe, assoc, whereEq, when, concat, reject, nth, map} from 'ramda'
import {findReplyId, findRootId} from 'src/util/nostr'
import {synced} from 'src/util/misc'
import {derived} from 'svelte/store'
import database from 'src/agent/database'
import keys from 'src/agent/keys'
import cmd from 'src/agent/cmd'

// Create a special wrapper to manage profile data, follows, and relays in the same
// way whether the user is logged in or not. This involves creating a store that we
// allow an anonymous user to write to, then once the user logs in we use that until
// we have actual event data for them, which we then prefer. For extra fun, we also
// sync this stuff to regular private variables so we don't have to constantly call
// `get` on our stores.

let settingsCopy = null
let profileCopy = null
let petnamesCopy = []
let relaysCopy = []
let mutesCopy = []

const anonPetnames = synced('agent/user/anonPetnames', [])
const anonRelays = synced('agent/user/anonRelays', [])
const anonMutes = synced('agent/user/anonMutes', [])

const settings = synced("agent/user/settings", {
  relayLimit: 20,
  defaultZap: 21,
  showMedia: true,
  reportAnalytics: true,
  dufflepudUrl: import.meta.env.VITE_DUFFLEPUD_URL,
})

const profile = derived(
  [keys.pubkey, database.people as Readable<any>],
  ([pubkey, $people]) => {
    if (!pubkey) {
      return null
    }

    return $people[pubkey] || {pubkey}
  }
) as Readable<Person>

const profileKeyWithDefault = (key, stores) => derived(
  [profile, ...stores],
  ([$profile, ...values]) =>
    $profile?.[key] || find(identity, values)
)

const petnames = profileKeyWithDefault('petnames', [anonPetnames])
const relays = profileKeyWithDefault('relays', [anonRelays])

// Backwards compat, migrate muffle to mute temporarily
const mutes = profileKeyWithDefault('mutes', [anonMutes, derived(profile, prop('muffle'))])

const canPublish = derived(
  [keys.pubkey, relays],
  ([$pubkey, $relays]) =>
    keys.canSign() && find(prop('write'), $relays)
)

// Keep our copies up to date

settings.subscribe($settings => {
  settingsCopy = $settings
})

profile.subscribe($profile => {
  profileCopy = $profile
})

petnames.subscribe($petnames => {
  petnamesCopy = $petnames
})

mutes.subscribe($mutes => {
  mutesCopy = $mutes
})

relays.subscribe($relays => {
  relaysCopy = $relays
})

const user = {
  // Settings

  settings,
  getSettings: () => settingsCopy,
  getSetting: k => settingsCopy[k],
  dufflepud: path => `${settingsCopy.dufflepudUrl}${path}`,

  // Profile

  profile,
  canPublish,
  getProfile: () => profileCopy,
  getPubkey: () => profileCopy?.pubkey,

  // Petnames

  petnames,
  getPetnames: () => petnamesCopy,
  petnamePubkeys: derived(petnames, map(nth(1))) as Readable<Array<string>>,
  updatePetnames(f) {
    const $petnames = f(petnamesCopy)

    anonPetnames.set($petnames)

    if (profileCopy) {
      return cmd.setPetnames($petnames).publish(relaysCopy)
    }
  },
  addPetname(pubkey, url, name) {
    const tag = ["p", pubkey, url, name || ""]

    return this.updatePetnames(pipe(reject(t => t[1] === pubkey), concat([tag])))
  },
  removePetname(pubkey) {
    return this.updatePetnames(reject(t => t[1] === pubkey))
  },

  // Relays

  relays,
  getRelays: () => relaysCopy,
  updateRelays(f) {
    const $relays = f(relaysCopy)

    anonRelays.set($relays)

    if (profileCopy) {
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
    return this.updateRelays(map(when(whereEq({url}), assoc('write', write))))
  },

  // Mutes

  mutes,
  getMutes: () => mutesCopy,
  applyMutes: events => {
    const m = new Set(mutesCopy.map(m => m[1]))

    return events.filter(e =>
      !(m.has(e.id) || m.has(e.pubkey) || m.has(findReplyId(e)) || m.has(findRootId(e)))
    )
  },
  updateMutes(f) {
    const $mutes = f(mutesCopy)
    console.log(mutesCopy, $mutes)

    anonMutes.set($mutes)

    if (profileCopy) {
      return cmd.setMutes($mutes.map(slice(0, 2))).publish(relaysCopy)
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

export default user
