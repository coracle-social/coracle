import {user, getPubkeyHints, getSetting} from "src/engine2/queries"
import {Subscription} from "./subscription"

export function loadNip59Messages() {
  const {pubkey} = user.get()

  return new Subscription({
    relays: getPubkeyHints(getSetting("relay_limit"), pubkey, "read"),
    filters: [{kinds: [1059], "#p": [pubkey]}],
  })
}
