import {Tags} from "paravel"
import {Naddr} from "src/util/nostr"
import {updateRecord} from "src/engine/core/commands"
import {projections} from "src/engine/core/projections"
import type {Event} from "src/engine/events/model"
import {_lists} from "./state"

const handleBookmarkList = (e: Event) => {
  const naddr = Naddr.fromEvent(e)
  const name = Tags.from(e).getValue("name") || naddr.identifier

  // Avoid malformed lists
  if (name) {
    _lists.key(naddr.asTagValue()).update($list => ({
      ...updateRecord($list, e.created_at, {tags: e.tags}),
      address: naddr.asTagValue(),
      pubkey: e.pubkey,
      name,
    }))
  }
}

projections.addHandler(30001, handleBookmarkList)
projections.addHandler(30003, handleBookmarkList)
