import {Tags} from "paravel"
import {Naddr} from "src/util/nostr"
import {updateRecord} from "src/engine/core/commands"
import {projections} from "src/engine/core/projections"
import type {Event} from "src/engine/events/model"
import {_lists} from "./state"

const handleBookmarkList = (e: Event) => {
  const naddr = Naddr.fromEvent(e)
  const {title, name, description} = Tags.fromEvent(e).asObject()
  const realTitle = title || name || naddr.identifier

  // Avoid malformed lists
  if (realTitle) {
    _lists.key(naddr.asTagValue()).update($list => ({
      ...updateRecord($list, e.created_at, {
        title: realTitle,
        tags: e.tags,
        description,
      }),
      address: naddr.asTagValue(),
      pubkey: e.pubkey,
    }))
  }
}

projections.addHandler(30001, handleBookmarkList)
projections.addHandler(30003, handleBookmarkList)
