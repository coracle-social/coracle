import {now} from "paravel"
import {subscribe} from "src/engine/network/utils"
import {getZapperForPubkey} from "./utils"

export const listenForZapResponse = async (pubkey, lnurl = null, opts) => {
  const zapper = await getZapperForPubkey(pubkey, lnurl)

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
