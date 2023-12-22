import {createAndPublish, getClientTags} from "src/engine/network/utils"

export const publishReview = (content, tags, relays = null) =>
  createAndPublish(1986, {content, tags: [...tags, ...getClientTags()], relays})

export const publishLabel = (tags, relays = null) =>
  createAndPublish(1985, {tags: [...tags, ...getClientTags()], relays})
