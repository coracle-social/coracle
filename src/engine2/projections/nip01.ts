import {people} from "src/engine2/state"
import {projections, updateKey} from "src/engine2/projections/core"

projections.addHandler(0, e => {
  updateKey(people.key(e.pubkey), e.created_at, {
    profile: JSON.parse(e.content),
  })
})
