import {batch} from "hurdak"
import {Tags} from "src/util/nostr"
import {projections} from "src/engine/core/projections"
import type {Event} from "src/engine/events/model"
import {sessions} from "src/engine/session/state"
import {nip59} from "src/engine/session/derived"
import {EventKind} from "./model"
import {_events, deletes, deletesLastUpdated} from "./state"

projections.addGlobalHandler(
  batch(500, (chunk: Event[]) => {
    const $sessions = sessions.get()
    const userEvents = chunk.filter(e => $sessions[e.pubkey])

    if (userEvents.length > 0) {
      _events.update($events => $events.concat(userEvents))
    }
  })
)

projections.addHandler(EventKind.Delete, e => {
  const values = Tags.from(e).type(["a", "e"]).values().all()

  deletesLastUpdated.update(ts => Math.max(ts, e.created_at))

  deletes.update($deletes => {
    values.forEach(v => $deletes.add(v))

    return $deletes
  })
})

projections.addHandler(EventKind.GiftWrap, e => {
  const session = sessions.get()[Tags.from(e).getMeta("p")]

  if (!session?.privkey) {
    return
  }

  nip59.get().withUnwrappedEvent(e, session.privkey, e => projections.push(e))
})
