import {Tags} from "src/util/nostr"
import {deletes} from "src/engine2/state"
import {projections} from "src/engine2/projections/core"

projections.addHandler(5, e => {
  Tags.from(e)
    .type(["a", "e"])
    .values()
    .all()
    .forEach(value => {
      deletes.key(value).set({value})
    })
})
