import {labels} from "src/engine2/state"
import {projections} from "src/engine2/projections/core"

projections.addHandler(1985, e => {
  labels.key(e.id).set(e)
})
