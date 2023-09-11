import {getIdOrNaddr} from "src/util/nostr"
import {getSetting, getPublishHints, mergeHints} from "src/engine2/queries"
import {publishEvent} from "./util"

export const publishDeletion = ({events}) => {
  const limit = getSetting("relay_limit")

  return publishEvent(5, {
    relays: mergeHints(
      limit,
      events.map(e => getPublishHints(limit, e))
    ),
    tags: events.map(getIdOrNaddr),
  })
}
