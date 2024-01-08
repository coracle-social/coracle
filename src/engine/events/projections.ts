import {max, pluck} from "ramda"
import {batch} from "hurdak"
import {Tags} from "paravel"
import {projections} from "src/engine/core/projections"
import type {Event} from "src/engine/events/model"
import {sessions} from "src/engine/session/state"
import {nip59} from "src/engine/session/derived"
import {_events, deletes, deletesLastUpdated} from "./state"

projections.addGlobalHandler(
  batch(500, (chunk: Event[]) => {
    const $sessions = sessions.get()
    const userEvents = chunk.filter(e => $sessions[e.pubkey] && !e.wrap)

    if (userEvents.length > 0) {
      _events.update($events => $events.concat(userEvents))
    }
  }),
)

projections.addHandler(
  5,
  batch(500, (chunk: Event[]) => {
    const values = Tags.from(chunk).type(["a", "e"]).values().all()

    deletesLastUpdated.update(ts => max(ts, pluck("created_at", chunk).reduce(max)))

    deletes.update($deletes => {
      values.forEach(v => $deletes.add(v))

      return $deletes
    })
  }),
)

projections.addHandler(1059, e => {
  const session = sessions.get()[Tags.from(e).getValue("p")]

  if (session?.privkey) {
    nip59.get().withUnwrappedEvent(e, session.privkey, e => projections.push(e))
  }
})
