import {Tags} from "src/util/nostr"
import {people} from "src/engine2/state"
import {projections, updateStore} from "src/engine2/projections/core"

projections.addHandler(3, e => {
  updateStore(people.key(e.pubkey), e.created_at, {
    petnames: Tags.from(e).type("p").all(),
  })
})

projections.addHandler(10000, e => {
  updateStore(people.key(e.pubkey), e.created_at, {
    mutes: Tags.from(e).type(["e", "p"]).all(),
  })
})