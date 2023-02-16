import {pipe, concat, reject, nth, map} from 'ramda'
import type {Person} from 'src/util/types'
import type {Readable} from 'svelte/store'
import {derived, get, writable} from 'svelte/store'
import database from 'src/agent/database'
import {getUserWriteRelays} from 'src/agent/relays'
import keys from 'src/agent/keys'
import cmd from 'src/agent/cmd'

export const user = derived(
  [keys.pubkey, database.people as Readable<any>],
  ([pubkey, $people]) => {
    if (!pubkey) {
      return null
    }

    return ($people[pubkey] || {pubkey})
  }
) as Readable<Person>

// Create a special wrapper to manage follows the same way whether
// the user is logged in or not

export const follows = (() => {
  const anonPetnames = writable([])

  const petnames = derived(
    [user, anonPetnames],
    ([$user, $anonPetnames]) =>
      $user?.petnames || $anonPetnames
  )

  return {
    petnames,
    pubkeys: derived(petnames, pipe(nth(0), map(nth(1)))),
    update(f) {
      const $petnames = f(get(petnames))

      anonPetnames.set($petnames)

      if (get(user)) {
        cmd.setPetnames(getUserWriteRelays(), $petnames)
      }
    },
    addFollow(pubkey, url, name) {
      const tag = ["p", pubkey, url, name || ""]

      this.update(pipe(reject(t => t[1] === pubkey), concat([tag])))
    },
    removeFollow(pubkey) {
      this.update(reject(t => t[1] === pubkey))
    },
  }
})()

