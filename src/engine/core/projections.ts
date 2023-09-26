import {prop} from "ramda"
import {Worker} from "src/engine/core/utils"
import type {Event} from "src/engine/events/model"

export const projections = new Worker<Event>({
  getKey: prop("kind"),
})
