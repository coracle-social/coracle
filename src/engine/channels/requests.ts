import {pluck, max, identity} from "ramda"
import {batch, seconds} from "hurdak"
import {EventKind} from "src/engine/events/model"
import {pubkey} from "src/engine/session/state"
import {load, loadPubkeys, subscribe} from "src/engine/network/utils"
import {getInboxHints, selectHints, getPubkeyHints, getUserRelayUrls} from "src/engine/relays/utils"
import {channels} from "./state"
import {getNip24ChannelPubkeys} from "./utils"
import {nip24Channels, nip04Channels} from "./derived"

export const loadAllNip04Messages = () => {
  const $pubkey = pubkey.get()
  const $channels = nip04Channels.get()
  const lastChecked = pluck("last_received", $channels).filter(identity).reduce(max, 0)
  const since = Math.max(0, lastChecked - seconds(7, "day"))

  load({
    relays: getUserRelayUrls("read"),
    filters: [
      {kinds: [4], authors: [$pubkey], since},
      {kinds: [4], "#p": [$pubkey], since},
    ],
    onEvent: batch(1000, events => {
      loadPubkeys(pluck("pubkey", events))
    }),
  })
}

export const listenForNip04Messages = (contactPubkey: string) => {
  const $pubkey = pubkey.get()

  return subscribe({
    relays: getInboxHints([contactPubkey, $pubkey]),
    filters: [
      {kinds: [EventKind.Nip04Message], authors: [$pubkey], "#p": [contactPubkey]},
      {kinds: [EventKind.Nip04Message], authors: [contactPubkey], "#p": [$pubkey]},
    ],
  })
}

export const loadAllNip24Messages = () => {
  const $pubkey = pubkey.get()
  const $channels = nip24Channels.get()
  const lastChecked = pluck("last_received", $channels).filter(identity).reduce(max, 0)
  const since = Math.max(0, lastChecked - seconds(7, "day"))

  // To avoid unwrapping everything twice, listen to channels and load pubkeys there
  const unsubscribe = nip24Channels.throttle(1000).subscribe($channels => {
    loadPubkeys($channels.flatMap(c => getNip24ChannelPubkeys(c.id)))
  })

  load({
    relays: getUserRelayUrls("read"),
    filters: [{kinds: [EventKind.GiftWrap], "#p": [$pubkey], since}],
    onClose: () => setTimeout(unsubscribe, 1000),
  })
}

export const listenForNip28Messages = channelId => {
  const channel = channels.key(channelId).get()
  const relays = selectHints(channel?.relays || [])

  return subscribe({
    relays,
    filters: [
      {kinds: [40], ids: [channelId]},
      {kinds: [41, 42], "#e": [channelId]},
    ],
  })
}

export const listenForNip59Messages = () => {
  const $pubkey = pubkey.get()

  return subscribe({
    relays: getPubkeyHints($pubkey, "read"),
    filters: [{kinds: [1059], "#p": [$pubkey]}],
  })
}
