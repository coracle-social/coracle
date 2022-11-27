import {writable} from "svelte/store"
import {getLocalJson, setLocalJson} from "src/util/misc"
import {nostr} from 'src/state/nostr'

export const user = writable(getLocalJson("coracle/user"))

user.subscribe($user => {
  setLocalJson("coracle/user", $user)

  // Keep nostr in sync
  if ($user?.privkey) {
    nostr.login($user.privkey)
  } else if ($user?.pubkey) {
    nostr.pubkeyLogin($user.pubkey)
  }
})

