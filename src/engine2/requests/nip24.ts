import {seconds} from "hurdak"
import {now} from "src/util/misc"
import {EventKind} from "src/engine2/model"
import {nip24ChannelsLastChecked} from "src/engine2/state"
import {session, getUserRelayUrls, nip24Channels, getNip24ChannelPubkeys} from "src/engine2/queries"
import {load} from "./load"
import {loadPubkeys} from "./pubkeys"

export function loadAllNip24Messages() {
  const {pubkey} = session.get()
  const since = Math.max(0, nip24ChannelsLastChecked.get() - seconds(7, "day"))

  nip24ChannelsLastChecked.set(now())

  // To avoid unwrapping everything twice, listen to channels and load pubkeys there
  const unsubscribe = nip24Channels.throttle(1000).subscribe($channels => {
    loadPubkeys($channels.flatMap(c => getNip24ChannelPubkeys(c.id)))
  })

  load({
    relays: getUserRelayUrls("read"),
    filters: [{kinds: [EventKind.GiftWrap], "#p": [pubkey], since}],
    onClose: () => setTimeout(unsubscribe, 1000),
  })
}
