import {max, pluck} from "ramda"
import {batch} from "hurdak"
import {Tags} from "paravel"
import {projections} from "src/engine/core/projections"
import type {Event} from "src/engine/events/model"
import {sessions} from "src/engine/session/state"
import {getNip04, getNip44, getNip59} from "src/engine/session/utils"
import {_events, deletes, seen, deletesLastUpdated, seenLastUpdated} from "./state"

const getSession = pubkey => sessions.get()[pubkey]

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

projections.addHandler(
  15,
  batch(500, (chunk: Event[]) => {
    const values = Tags.from(chunk).type("e").values().all()

    seenLastUpdated.update(ts => max(ts, pluck("created_at", chunk).reduce(max)))

    seen.update($seen => {
      values.forEach(v => $seen.add(v))

      return $seen
    })
  }),
)

projections.addHandler(1059, wrap => {
  const session = getSession(Tags.from(wrap).pubkeys().first())

  if (!session) {
    return
  }

  if (getNip44(session).isEnabled()) {
    getNip59(session).withUnwrappedEvent(wrap, session.privkey, rumor => {
      projections.push(rumor)
    })
  }
})

projections.addHandler(1060, wrap => {
  const session = getSession(Tags.from(wrap).pubkeys().first())

  if (!session) {
    return
  }

  if (getNip04(session).isEnabled()) {
    getNip59(session).withUnwrappedEvent(wrap, session.privkey, rumor => {
      projections.push(rumor)
    })
  }
})
