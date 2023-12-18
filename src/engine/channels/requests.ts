import {assocPath, uniq} from "ramda"
import {seconds} from "hurdak"
import {now} from "paravel"
import {sessions} from "src/engine/session/state"
import {session} from "src/engine/session/derived"
import {loadPubkeys, subscribe} from "src/engine/network/utils"
import {getPubkeyHints, getUserHints} from "src/engine/relays/utils"
import {channels} from "./state"

export const loadAllMessages = () => {
  const {pubkey, nip24_messages_last_synced = 0} = session.get()
  const since = Math.max(0, nip24_messages_last_synced - seconds(3, "day"))

  sessions.update(assocPath([pubkey, "nip24_messages_last_synced"], now()))

  // To avoid unwrapping everything twice, listen to channels and load pubkeys there
  const unsubscribe = channels.throttle(1000).subscribe($channels => {
    loadPubkeys($channels.flatMap(c => c.members || []))
  })

  subscribe({
    skipCache: true,
    timeout: 30_000,
    relays: getUserHints("read"),
    filters: [
      {kinds: [4], authors: [pubkey], since},
      {kinds: [4, 1059], "#p": [pubkey], since},
    ],
    onClose: () => setTimeout(unsubscribe, 1000),
  })
}

export const listenForMessages = pubkeys => {
  const {pubkey} = session.get()
  const allPubkeys = uniq(pubkeys.concat(pubkey))

  return subscribe({
    skipCache: true,
    relays: getPubkeyHints(pubkey, "read"),
    filters: [
      {kinds: [4], authors: allPubkeys, "#p": allPubkeys},
      {kinds: [1059], "#p": [pubkey]},
    ],
  })
}
