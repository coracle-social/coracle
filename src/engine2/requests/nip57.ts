import {now} from "src/util/misc"
import {people} from "src/engine2/state"
import {Subscription} from "./subscription"

export function loadZapResponse({pubkey, relays}) {
  const {zapper} = people.key(pubkey).get()

  return new Subscription({
    relays,
    filters: [
      {
        kinds: [9735],
        authors: [zapper.nostrPubkey],
        "#p": [pubkey],
        since: now() - 10,
      },
    ],
  })
}
