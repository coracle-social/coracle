import {prop} from "ramda"
import {batch} from "hurdak"
import {Worker} from "src/engine/util/worker"
import type {Event} from "src/engine/model"
import {events, sessions} from "src/engine/state"

export const projections = new Worker<Event>({
  getKey: prop("kind"),
})

export const updateRecord = (record, timestamp, updates) => {
  for (const [field, value] of Object.entries(updates)) {
    const tsField = `${field}_updated_at`
    const lastUpdated = record?.[tsField] || 0

    if (timestamp > lastUpdated) {
      record = {
        ...record,
        [field]: value,
        [tsField]: timestamp,
        updated_at: Math.max(timestamp, record?.updated_at || 0),
      }
    }
  }

  return record
}

export const updateStore = (store, timestamp, updates) =>
  store.set(updateRecord(store.get(), timestamp, updates))

projections.addGlobalHandler(
  batch(500, chunk => {
    const $sessions = sessions.get()
    const userEvents = chunk.filter(e => $sessions[e.pubkey])

    if (userEvents.length > 0) {
      events.mapStore.update($events => {
        for (const e of userEvents) {
          $events.set(e.id, e)
        }

        return $events
      })
    }
  })
)
