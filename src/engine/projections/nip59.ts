import {Tags} from "src/util/nostr"
import {sessions} from "src/engine/state"
import {nip59} from "src/engine/queries"
import {projections} from "src/engine/projections/core"

projections.addHandler(1059, e => {
  const session = sessions.get()[Tags.from(e).getMeta("p")]

  if (!session?.privkey) {
    return
  }

  nip59.get().withUnwrappedEvent(e, session.privkey, e => projections.push(e))
})
