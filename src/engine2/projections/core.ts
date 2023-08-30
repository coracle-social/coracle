import {prop} from "ramda"
import {Worker} from "src/engine2/util/worker"
import type {Event} from "src/engine2/model"

export const projections = new Worker<Event>({
  getKey: prop("kind"),
})
