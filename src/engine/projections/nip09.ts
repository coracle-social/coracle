import {Tags} from "src/util/nostr"
import {deletes} from "src/engine/state"
import {projections} from "src/engine/projections/core"

projections.addHandler(5, e => {
  Tags.from(e)
    .type(["a", "e"])
    .values()
    .all()
    .forEach(value => {
      deletes.key(value).set({value, created_at: e.created_at})
    })
})
