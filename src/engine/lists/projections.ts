import {Tags} from "paravel"
import {Naddr} from "src/util/nostr"
import {updateRecord} from "src/engine/core/commands"
import {projections} from "src/engine/core/projections"
import type {Event} from "src/engine/events/model"
import {_lists} from "./state"

const handleBookmarkList = (e: Event) => {
  const naddr = Naddr.fromEvent(e)
  const tags = Tags.from(e)
  const title = tags.getValue("title") || tags.getValue("name") || naddr.identifier
  const description = tags.getValue("description") || ""

  // Avoid malformed lists
  if (title) {
    _lists.key(naddr.asTagValue()).update($list => ({
      ...updateRecord($list, e.created_at, {
        tags: e.tags,
        description,
        title,
      }),
      address: naddr.asTagValue(),
      pubkey: e.pubkey,
    }))
  }
}

projections.addHandler(30001, handleBookmarkList)
projections.addHandler(30003, handleBookmarkList)
