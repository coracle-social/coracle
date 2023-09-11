import {getSetting, getPublishHints} from "src/engine2/queries"
import {publishEvent, getReplyTags} from "./util"
import {Publisher} from "./publisher"

export const publishReaction = ({parent, content = "", tags = []}) => {
  const relays = getPublishHints(getSetting("relay_limit"), parent)

  // Re-broadcast the note we're reacting to
  Publisher.publish({relays, event: parent})

  return publishEvent(7, {relays, content, tags: [...tags, ...getReplyTags(parent)]})
}
