import {publishEvent} from "src/engine/network/utils"

export const publishReview = (content, tags, relays = null) =>
  publishEvent(1985, {content, tags, relays})

export const publishLabel = (tags, relays = null) => publishEvent(1985, {tags, relays})
