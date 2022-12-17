import {writable} from "svelte/store"
import {getLocalJson, setLocalJson} from "src/util/misc"
import relay from 'src/relay'

export const user = writable(getLocalJson("coracle/user"))

user.subscribe($user => {
  setLocalJson("coracle/user", $user)

  // Keep nostr in sync
  if ($user?.privkey) {
    relay.pool.setPrivateKey($user.privkey)
  } else if ($user?.pubkey) {
    relay.pool.setPublicKey($user.pubkey)
  }

  // Migrate data from old formats
  if ($user && (!$user.petnames || !$user.muffle)) {
    user.set({...$user, petnames: [], muffle: []})
  }
})

