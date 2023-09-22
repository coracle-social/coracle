import {Tags} from "src/util/nostr"
import {projections} from "src/engine/core/projections"
import {sessions} from "src/engine/session/state"
import {nip59} from "src/engine/session/derived"
import {EventKind} from "./model"
import {deletes} from "./state"

projections.addHandler(EventKind.Delete, e => {
  Tags.from(e)
    .type(["a", "e"])
    .values()
    .all()
    .forEach(value => {
      deletes.key(value).set({value, created_at: e.created_at})
    })
})

projections.addHandler(EventKind.GiftWrap, e => {
  const session = sessions.get()[Tags.from(e).getMeta("p")]

  if (!session?.privkey) {
    return
  }

  nip59.get().withUnwrappedEvent(e, session.privkey, e => projections.push(e))
})
