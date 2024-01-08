import {projections} from "src/engine/core/projections"
import {_labels} from "./state"

projections.addHandler(1985, e => {
  _labels.key(e.id).set(e)
})
