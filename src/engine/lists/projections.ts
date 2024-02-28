import {Tags, Address} from "paravel"
import {updateRecord} from "src/engine/core/commands"
import {projections} from "src/engine/core/projections"
import type {Event} from "src/engine/events/model"
import {_lists} from "./state"

const handleBookmarkList = (e: Event) => {
  const addr = Address.fromEvent(e)
  const {title, name, description} = Tags.fromEvent(e).asObject()
  const realTitle = title || name || addr.identifier

  // Avoid malformed lists
  if (realTitle) {
    _lists.key(addr.asRaw()).update($list => ({
      ...updateRecord($list, e.created_at, {
        title: realTitle,
        tags: e.tags,
        description,
      }),
      address: addr.asRaw(),
      pubkey: e.pubkey,
    }))
  }
}

projections.addHandler(30001, handleBookmarkList)
projections.addHandler(30003, handleBookmarkList)
