import {writable, get} from "svelte/store"
import {getLocalJson, setLocalJson} from "src/util/misc"
import {nostr, channels} from 'src/state/nostr'

export const user = writable(getLocalJson("coracle/user"))

user.subscribe($user => {
  setLocalJson("coracle/user", $user)

  // Keep nostr in sync
  nostr.login($user?.privkey)
})
