import {writable} from "svelte/store"
import {getLocalJson, setLocalJson} from "src/util/misc"
import {nostr} from 'src/state/nostr'
import relay from 'src/relay'

export const user = writable(getLocalJson("coracle/user"))

user.subscribe($user => {
  setLocalJson("coracle/user", $user)

  // Keep nostr in sync
  if ($user?.privkey) {
    nostr.login($user.privkey)
    relay.worker.post('pool/setPrivateKey', $user.privkey)
  } else if ($user?.pubkey) {
    nostr.pubkeyLogin($user.pubkey)
    relay.worker.post('pool/setPublicKey', $user.pubkey)
  }

  // Migrate data from old formats
  if ($user && (!$user.petnames || !$user.muffle)) {
    user.set({...$user, petnames: [], muffle: []})
  }
})

