import {getSetting, getPublishHints} from "src/engine2/queries"
import {publishEvent, getReplyTags} from "./util"
import {Publisher} from "./publisher"

export const publishUserProfile = ({content, ...opts}) =>
  publishEvent(0, {...opts, content: JSON.stringify(content)})

export const publishNote = opts => publishEvent(1, opts)

export const publishReply = ({parent, content = "", tags = []}) => {
  const relays = getPublishHints(getSetting("relay_limit"), parent)

  // Re-broadcast the note we're replying to
  Publisher.publish({relays, event: parent})

  return publishEvent(1, {relays, content, tags: [...tags, ...getReplyTags(parent, true)]})
}
