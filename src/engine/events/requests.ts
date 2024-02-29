import {seconds} from "hurdak"
import {session, nip44, nip04} from "src/engine/session/derived"
import {hints} from "src/engine/relays/utils"
import {load} from "src/engine/network/utils"

export const loadDeletes = () => {
  const {pubkey, deletes_last_synced = 0} = session.get()
  const since = Math.max(0, deletes_last_synced - seconds(6, "hour"))

  return load({
    relays: hints.Aggregate().getUrls(),
    filters: [{kinds: [5], authors: [pubkey], since}],
  })
}

export const loadSeen = () => {
  const {pubkey, deletes_last_synced = 0} = session.get()
  const since = Math.max(0, deletes_last_synced - seconds(6, "hour"))

  return load({
    relays: hints.NoteToSelf().getUrls(),
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
      relays: hints.FetchAllMessages().getUrls(),
      filters: [{kinds: [1059, 1060], authors: [pubkey], since}],
    })
  }
}
