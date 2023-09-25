import {projections} from "src/engine/core/projections"
import {EventKind} from "src/engine/events/model"
import {_labels} from "./state"

projections.addHandler(EventKind.Label, e => {
  _labels.key(e.id).set(e)
})
