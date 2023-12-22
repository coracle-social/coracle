import {getIdAndAddress} from "src/util/nostr"
import {getUserHints} from "src/engine/relays/utils"
import {createAndPublish} from "src/engine/network/utils"

export const publishNote = (content, tags = [], relays = null) =>
  createAndPublish(1, {content, tags, relays})

export const publishDeletion = (ids, relays = null) =>
  createAndPublish(5, {
    relays: relays || getUserHints("write"),
    tags: ids.map(id => [id.includes(":") ? "a" : "e", id]),
  })

export const publishDeletionForEvent = (event, relays = null) =>
  publishDeletion(getIdAndAddress(event), relays)
