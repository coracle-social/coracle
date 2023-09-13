import {prop} from "ramda"
import {Worker} from "src/engine2/util/worker"
import type {Event} from "src/engine2/model"

export const projections = new Worker<Event>({
  getKey: prop("kind"),
})

export const updateKey = (key, timestamp, updates, modify = (a: any) => a) => {
  let record = key.get()

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

  key.set(modify(record))
}
