import {createAndPublish, tagsFromContent, getClientTags} from "src/engine/network/utils"

export const publishReview = (content, tags, relays = null) =>
  createAndPublish({
    kind: 1986,
    tags: [...tags, ...getClientTags(), ...tagsFromContent(content)],
    content,
    relays,
  })

export const publishLabel = (tags, relays = null) =>
  createAndPublish({
    kind: 1985,
    tags: [...tags, ...getClientTags()],
    relays,
  })
