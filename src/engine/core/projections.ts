import {prop} from "ramda"
import {batch} from "hurdak"
import {Worker} from "src/engine/core/utils"
import type {Event} from "src/engine/events/model"
import {sessions} from "src/engine/session/state"
import {_events} from "src/engine/events/state"

export const projections = new Worker<Event>({
  getKey: prop("kind"),
})

projections.addGlobalHandler(
  batch(500, (chunk: Event[]) => {
    const $sessions = sessions.get()
    const userEvents = chunk.filter(e => $sessions[e.pubkey])

    if (userEvents.length > 0) {
      _events.mapStore.update($events => {
        for (const e of userEvents) {
          $events.set(e.id, e)
        }

        return $events
      })
    }
  })
)
