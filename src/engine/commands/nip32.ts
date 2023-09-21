import {publishEvent} from "./util"

export const publishReview = (content, tags, relays = null) =>
  publishEvent(1985, {content, tags, relays})

export const publishLabel = (tags, relays = null) => publishEvent(1985, {tags, relays})
