import {nip19} from "nostr-tools"
import {Tags} from "src/util/nostr"
import type {Event} from "src/engine/model"
import {lists} from "src/engine/state"
import {projections, updateRecord} from "src/engine/projections/core"

projections.addHandler(30001, (e: Event) => {
  const name = Tags.from(e).getMeta("d")
  const naddr = nip19.naddrEncode({
    identifier: name,
    pubkey: e.pubkey,
    kind: e.kind,
  })

  lists.key(naddr).update($list => ({
    ...updateRecord($list, e.created_at, {tags: e.tags}),
    pubkey: e.pubkey,
    name,
  }))
})
