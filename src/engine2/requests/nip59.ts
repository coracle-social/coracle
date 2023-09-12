import {user, getPubkeyHints, getSetting} from "src/engine2/queries"
import {subscribe} from "./subscription"

export function listenForNip59Messages() {
  const {pubkey} = user.get()

  return subscribe({
    relays: getPubkeyHints(getSetting("relay_limit"), pubkey, "read"),
    filters: [{kinds: [1059], "#p": [pubkey]}],
  })
}
