import {seconds} from "hurdak"
import type {Event} from "nostr-tools"
import {Worker} from "@coracle.social/lib"
import {giftWrapKinds} from "src/util/nostr"
import {session, nip44, nip04} from "src/engine/session/derived"
import {hints} from "src/engine/relays/utils"
import {load, MultiCursor, Publisher} from "src/engine/network/utils"

export const loadDeletes = () => {
  const {pubkey, deletes_last_synced = 0} = session.get()
  const since = Math.max(0, deletes_last_synced - seconds(6, "hour"))

  return load({
    relays: hints.User().getUrls(),
    filters: [{kinds: [5], authors: [pubkey], since}],
  })
}

export const loadSeen = () => {
  const {pubkey, deletes_last_synced = 0} = session.get()
  const since = Math.max(0, deletes_last_synced - seconds(6, "hour"))

  return load({
    relays: hints.WriteRelays().getUrls(),
    filters: [{kinds: [15], authors: [pubkey], since}],
  })
}

export const loadGiftWrap = () => {
  const kinds = []

  if (nip44.get().isEnabled()) {
    kinds.push(1059)
  }

  if (nip04.get().isEnabled()) {
    kinds.push(1060)
  }

  if (kinds.length > 0) {
    const {pubkey, nip59_messages_last_synced = 0} = session.get()
    const since = Math.max(0, nip59_messages_last_synced - seconds(6, "hour"))

    return load({
      skipCache: true,
      relays: hints.User().getUrls(),
      filters: [{kinds: giftWrapKinds, authors: [pubkey], since}],
    })
  }
}

export const sync = (fromUrl, toUrl, filters) => {
  const worker = new Worker<Event>()

  worker.addGlobalHandler(event => Publisher.publish({event, relays: [toUrl]}))

  const cursor = new MultiCursor({
    relaySelections: [{relay: fromUrl, filters}],
    onEvent: worker.push,
  })

  cursor.loadAll()
}
