import {Tags, encodeAddress} from "@welshman/util"
import {updateRecord} from "src/engine/core/commands"
import {projections} from "src/engine/network"
import type {Event} from "src/engine/events/model"
import {_lists} from "./state"

const handleBookmarkList = async (e: Event) => {
  // TODO: Evil hack; there is a circular dependency somewhere
  const {hints} = await import("src/engine/relays/utils")

  const addr = hints.address(e)
  const {title, name, description} = Tags.fromEvent(e).asObject()
  const realTitle = title || name || addr.identifier

  // Avoid malformed lists
  if (realTitle) {
    _lists.key(encodeAddress(addr)).update($list => ({
      ...updateRecord($list, e.created_at, {
        title: realTitle,
        tags: e.tags,
        description,
      }),
      address: encodeAddress(addr),
      pubkey: e.pubkey,
    }))
  }
}

projections.addHandler(30001, handleBookmarkList)
projections.addHandler(30003, handleBookmarkList)
