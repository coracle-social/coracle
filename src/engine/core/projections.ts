import {prop} from "ramda"
import {Worker} from "@coracle.social/lib"
import type {Event} from "src/engine/events/model"

export const projections = new Worker<Event>({
  getKey: prop("kind"),
})
