import {identity, without} from 'ramda'
import {getPublicKey} from 'nostr-tools'
import {get} from 'svelte/store'
import {defmulti} from "hurdak/lib/hurdak"
import {db} from "src/state/db"
import {user} from "src/state/user"
import {nostr, relays} from 'src/state/nostr'

// Commands are processed in two layers:
// - App-oriented commands are created via dispatch
// - processEvent, which can be used to populate the database
//   whether commands are coming from our instance or a remote instance.

export const dispatch = defmulti("dispatch", identity)

dispatch.addMethod("account/init", async (topic, privkey) => {
  // Generate a public key
  const pubkey = getPublicKey(privkey)

  // Set what we know about the user to our store
  user.set({name: pubkey.slice(0, 8), privkey, pubkey})

  // Attempt to refresh user data from the network
  const found = Boolean(await user.refresh())

  // Tell the caller whether this user was found
  return {found}
})

dispatch.addMethod("account/update", async (topic, updates) => {
  // Update our local copy
  user.set({...get(user), ...updates})

  // Tell the network
  await nostr.publish(nostr.event(0, JSON.stringify(updates)))
})

dispatch.addMethod("relay/join", (topic, url) => {
  relays.update(r => r.concat(url))
})

dispatch.addMethod("relay/leave", (topic, url) => {
  relays.update(r => without([url], r))
})
