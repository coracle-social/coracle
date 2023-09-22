import {fromDisplayEvent} from "src/util/nostr"
import {getPublishHints, getUserRelayUrls} from "src/engine/relays/utils"
import {Publisher, publishEvent, getReplyTags} from "src/engine/network/utils"

export const publishNote = (content, tags = [], relays = null) =>
  publishEvent(1, {content, tags, relays})

export const publishReply = (parent, content, tags = []) => {
  const relays = getPublishHints(parent)

  // Re-broadcast the note we're replying to
  Publisher.publish({relays, event: fromDisplayEvent(parent)})

  return publishEvent(1, {relays, content, tags: [...tags, ...getReplyTags(parent, true)]})
}

export const publishDeletion = (ids, relays = null) =>
  publishEvent(5, {
    relays: relays || getUserRelayUrls("write"),
    tags: ids.map(id => [id.includes(":") ? "a" : "e", id]),
  })

export const publishReaction = (parent, content = "", tags = []) => {
  const relays = getPublishHints(parent)

  // Re-broadcast the note we're reacting to
  Publisher.publish({relays, event: fromDisplayEvent(parent)})

  return publishEvent(7, {relays, content, tags: [...tags, ...getReplyTags(parent)]})
}
