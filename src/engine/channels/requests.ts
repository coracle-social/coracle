import {assocPath} from "ramda"
import {seconds} from "hurdak"
import {now} from "paravel"
import {EventKind} from "src/engine/events/model"
import {sessions} from "src/engine/session/state"
import {session} from "src/engine/session/derived"
import {load, loadPubkeys, subscribe} from "src/engine/network/utils"
import {getPubkeyHints, getUserRelayUrls} from "src/engine/relays/utils"
import {nip24Channels} from "./derived"

export const loadAllNip24Messages = () => {
  const {pubkey, nip24_messages_last_synced} = session.get()
  const since = Math.max(0, nip24_messages_last_synced - seconds(3, "day"))

  sessions.update(assocPath([pubkey, "nip24_messages_last_synced"], now()))

  // To avoid unwrapping everything twice, listen to channels and load pubkeys there
  const unsubscribe = nip24Channels.throttle(1000).subscribe($channels => {
    loadPubkeys($channels.flatMap(c => c.members))
  })

  load({
    relays: getUserRelayUrls("read"),
    filters: [{kinds: [EventKind.GiftWrap], "#p": [pubkey], since}],
    onClose: () => setTimeout(unsubscribe, 1000),
  })
}

export const listenForNip59Messages = () => {
  const {pubkey} = session.get()

  return subscribe({
    relays: getPubkeyHints(pubkey, "read"),
    filters: [{kinds: [1059], "#p": [pubkey]}],
  })
}
