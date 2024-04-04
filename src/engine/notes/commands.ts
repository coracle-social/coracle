import {getIdAndAddress} from "@coracle.social/util"
import {hints, forcePlatformRelays} from "src/engine/relays/utils"
import {createAndPublish} from "src/engine/network/utils"

export const publishNote = (content, tags = []) =>
  createAndPublish({
    kind: 1,
    content,
    tags,
    relays: forcePlatformRelays(hints.WriteRelays().getUrls()),
  })

export const publishDeletion = ids =>
  createAndPublish({
    kind: 5,
    tags: ids.map(id => [id.includes(":") ? "a" : "e", id]),
    relays: forcePlatformRelays(hints.WriteRelays().getUrls()),
  })

export const publishDeletionForEvent = event => publishDeletion(getIdAndAddress(event))
