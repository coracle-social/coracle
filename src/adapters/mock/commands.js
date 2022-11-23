import {identity} from 'ramda'
import {defmulti} from "hurdak/lib/hurdak"
import keys from "src/util/keys"
import {db} from "src/adapters/mock/db"
import {user} from "src/adapters/mock/user"
import {broadcastNewEvent} from "src/adapters/mock/events"

// Commands are processed in two layers:
// - App-oriented commands are created via dispatch
// - processEvent, which can be used to populate the database
//   whether commands are coming from our instance or a remote instance.

export const dispatch = defmulti("commands/dispatch", identity)

dispatch.addMethod("account/init", (topic, privkey) => {
  const pubkey = keys.getPublicKey(privkey)

  user.set({
    pubkey,
    privkey,
    name: pubkey.slice(0, 8),
    picture: null,
    about: null,
  })
})

dispatch.addMethod("server/join", (topic, s) => {
  db.relays.put(s)
})

dispatch.addMethod("server/leave", (topic, s) => {
  db.relays.where("url").equals(s.url).delete()
})

dispatch.addMethod("post/create", broadcastNewEvent)
