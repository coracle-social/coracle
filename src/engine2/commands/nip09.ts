import {getIdOrNaddr} from "src/util/nostr"
import {getPublishHints, mergeHints} from "src/engine2/queries"
import {publishEvent} from "./util"

export const publishDeletion = events =>
  publishEvent(5, {
    relays: mergeHints(events.map(getPublishHints)),
    tags: events.map(getIdOrNaddr),
  })
