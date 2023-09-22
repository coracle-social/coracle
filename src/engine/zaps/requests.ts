import {now} from "src/util/misc"
import {people} from "src/engine/people/state"
import {subscribe} from "src/engine/network/utils"

export const listenForZapResponse = (pubkey, opts) => {
  const {zapper} = people.key(pubkey).get()

  return subscribe({
    ...opts,
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
