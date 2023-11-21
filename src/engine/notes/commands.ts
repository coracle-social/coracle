import {createEvent} from "paravel"
import {getIdAndAddress} from 'src/util/nostr'
import {getUserRelayUrls} from "src/engine/relays/utils"
import {createAndPublish, getReplyTags} from "src/engine/network/utils"

export const publishNote = (content, tags = [], relays = null) =>
  createAndPublish(1, {content, tags, relays})

export const publishDeletion = (ids, relays = null) =>
  createAndPublish(5, {
    relays: relays || getUserRelayUrls("write"),
    tags: ids.map(id => [id.includes(":") ? "a" : "e", id]),
  })

export const publishDeletionForEvent = (event, relays = null) =>
  publishDeletion(getIdAndAddress(event), relays)

export const buildReply = (parent, content, tags = []) =>
  createEvent(1, {content, tags: [...tags, ...getReplyTags(parent, true)]})

export const buildReaction = (parent, content = "", tags = []) =>
  createEvent(7, {content, tags: [...tags, ...getReplyTags(parent)]})
