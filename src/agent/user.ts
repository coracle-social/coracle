import type {Person} from 'src/util/types'
import type {Readable} from 'svelte/store'
import {derived} from 'svelte/store'
import database from 'src/agent/database'
import keys from 'src/agent/keys'

export const user = derived(
  [keys.pubkey, database.people as Readable<any>],
  ([pubkey, $people]) => {
    if (!pubkey) {
      return null
    }

    return ($people[pubkey] || {pubkey})
  }
) as Readable<Person>
