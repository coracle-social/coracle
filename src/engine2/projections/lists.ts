import {nip19} from "nostr-tools"
import {mergeLeft} from "ramda"
import {Tags} from "src/util/nostr"
import type {Event} from "src/engine2/model"
import {lists} from "src/engine2/state"
import {projections, updateKey} from "src/engine2/projections/core"

projections.addHandler(30001, (e: Event) => {
  const name = Tags.from(e).getMeta("d")
  const naddr = nip19.naddrEncode({
    identifier: name,
    pubkey: e.pubkey,
    kind: e.kind,
  })

  updateKey(lists.key(naddr), e.created_at, {tags: e.tags}, mergeLeft({name, pubkey: e.pubkey}))
})
