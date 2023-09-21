import {fromDisplayEvent} from "src/util/nostr"
import {getPublishHints} from "src/engine/queries"
import {publishEvent, getReplyTags} from "./util"
import {Publisher} from "./publisher"

export const publishReaction = (parent, content = "", tags = []) => {
  const relays = getPublishHints(parent)

  // Re-broadcast the note we're reacting to
  Publisher.publish({relays, event: fromDisplayEvent(parent)})

  return publishEvent(7, {relays, content, tags: [...tags, ...getReplyTags(parent)]})
}
