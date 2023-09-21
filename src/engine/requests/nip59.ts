import {user, getPubkeyHints} from "src/engine/queries"
import {subscribe} from "./subscription"

export function listenForNip59Messages() {
  const {pubkey} = user.get()

  return subscribe({
    relays: getPubkeyHints(pubkey, "read"),
    filters: [{kinds: [1059], "#p": [pubkey]}],
  })
}
