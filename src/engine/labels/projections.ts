import {projections} from "src/engine/core/projections"
import {EventKind} from "src/engine/events/model"
import {labels} from "./state"

projections.addHandler(EventKind.Label, e => {
  labels.key(e.id).set(e)
})
