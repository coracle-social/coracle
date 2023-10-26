import {pluck, assocPath} from "ramda"
import {batch, seconds} from "hurdak"
import {now} from "paravel"
import {EventKind} from "src/engine/events/model"
import {sessions} from "src/engine/session/state"
import {session} from "src/engine/session/derived"
import {load, loadPubkeys, subscribe} from "src/engine/network/utils"
import {getInboxHints, getPubkeyHints, getUserRelayUrls} from "src/engine/relays/utils"
import {nip24Channels} from "./derived"

export const loadAllNip04Messages = () => {
  const {pubkey, nip04_messages_last_synced = 0} = session.get()
  const since = Math.max(0, nip04_messages_last_synced - seconds(3, "day"))

  sessions.update(assocPath([pubkey, "nip04_messages_last_synced"], now()))

  load({
    relays: getUserRelayUrls("read"),
    filters: [
      {kinds: [4], authors: [pubkey], since},
      {kinds: [4], "#p": [pubkey], since},
    ],
    onEvent: batch(1000, events => {
      loadPubkeys(pluck("pubkey", events))
    }),
  })
}

export const listenForNip04Messages = (contactPubkey: string) => {
  const {pubkey} = session.get()

  return subscribe({
    relays: getInboxHints([contactPubkey, pubkey]),
    filters: [
      {kinds: [EventKind.Nip04Message], authors: [pubkey], "#p": [contactPubkey]},
      {kinds: [EventKind.Nip04Message], authors: [contactPubkey], "#p": [pubkey]},
    ],
  })
}

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
