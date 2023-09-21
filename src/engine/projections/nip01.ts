import {people} from "src/engine/state"
import {projections, updateStore} from "src/engine/projections/core"

projections.addHandler(0, e => {
  updateStore(people.key(e.pubkey), e.created_at, {
    profile: JSON.parse(e.content),
  })
})
