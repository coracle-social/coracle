import {assocPath, uniq} from "ramda"
import {seconds} from "hurdak"
import {now} from "@coracle.social/lib"
import {sessions} from "src/engine/session/state"
import {session} from "src/engine/session/derived"
import {loadPubkeys, subscribe, MultiCursor} from "src/engine/network/utils"
import {hints} from "src/engine/relays/utils"
import {channels} from "./state"

export const loadAllMessages = ({reload = false} = {}) => {
  const {pubkey, nip24_messages_last_synced = 0} = session.get()
  const since = reload ? 0 : Math.max(0, nip24_messages_last_synced - seconds(6, "hour"))

  sessions.update(assocPath([pubkey, "nip24_messages_last_synced"], now()))

  // To avoid unwrapping everything twice, listen to channels and load pubkeys there
  const unsubscribePubkeys = channels.throttle(1000).subscribe($channels => {
    loadPubkeys($channels.flatMap(c => c.members || []))
  })

  const relays = hints.User().getUrls()

  const filters = [
    {kinds: [4], authors: [pubkey], since},
    {kinds: [4, 1059], "#p": [pubkey], since},
  ]

  const cursor = new MultiCursor({
    relayFilters: relays.map(relay => [relay, filters]),
  })

  return cursor.loadAll({
    onComplete: unsubscribePubkeys,
  })
}

export const listenForMessages = (pubkeys: string[]) => {
  const {pubkey} = session.get()
  const allPubkeys = uniq(pubkeys.concat(pubkey))

  return subscribe({
    skipCache: true,
    relays: hints.Messages(pubkeys).getUrls(),
    filters: [
      {kinds: [4], authors: allPubkeys, "#p": allPubkeys},
      {kinds: [1059], "#p": [pubkey]},
    ],
  })
}
