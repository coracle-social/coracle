import {createAndPublish} from "src/engine/network/utils"

export const publishReview = (content, tags, relays = null) =>
  createAndPublish(1986, {content, tags, relays})

export const publishLabel = (tags, relays = null) => createAndPublish(1985, {tags, relays})
