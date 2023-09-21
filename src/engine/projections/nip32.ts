import {labels} from "src/engine/state"
import {projections} from "src/engine/projections/core"

projections.addHandler(1985, e => {
  labels.key(e.id).set(e)
})
