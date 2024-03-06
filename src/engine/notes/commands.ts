import {getIdAndAddress} from "paravel"
import {hints} from "src/engine/relays/utils"
import {createAndPublish} from "src/engine/network/utils"

export const publishNote = (content, tags = [], relays = null) =>
  createAndPublish(1, {content, tags, relays})

export const publishDeletion = ids =>
  createAndPublish(5, {
    relays: hints.WriteRelays().getUrls(),
    tags: ids.map(id => [id.includes(":") ? "a" : "e", id]),
  })

export const publishDeletionForEvent = event => publishDeletion(getIdAndAddress(event))
