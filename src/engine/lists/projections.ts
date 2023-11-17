import {Tags} from "paravel"
import {nip19} from "nostr-tools"
import {updateRecord} from "src/engine/core/commands"
import {projections} from "src/engine/core/projections"
import type {Event} from "src/engine/events/model"
import {_lists} from "./state"

const handleBookmarkList = (e: Event) => {
  const tags = Tags.from(e)
  const d = tags.getValue("d")
  const name = tags.getValue("name") || d
  const naddr = nip19.naddrEncode({
    identifier: d,
    pubkey: e.pubkey,
    kind: e.kind,
  })

  _lists.key(naddr).update($list => ({
    ...updateRecord($list, e.created_at, {tags: e.tags}),
    pubkey: e.pubkey,
    name,
  }))
}

projections.addHandler(30001, handleBookmarkList)
projections.addHandler(30003, handleBookmarkList)
