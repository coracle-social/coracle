import {nip19} from "nostr-tools"
import {Tags} from "src/util/nostr"
import {updateRecord} from "src/engine/core/commands"
import {projections} from "src/engine/core/projections"
import type {Event} from "src/engine/events/model"
import {EventKind} from "src/engine/events/model"
import {_lists} from "./state"

projections.addHandler(EventKind.BookmarkList, (e: Event) => {
  const name = Tags.from(e).getMeta("d")
  const naddr = nip19.naddrEncode({
    identifier: name,
    pubkey: e.pubkey,
    kind: e.kind,
  })

  _lists.key(naddr).update($list => ({
    ...updateRecord($list, e.created_at, {tags: e.tags}),
    pubkey: e.pubkey,
    name,
  }))
})
