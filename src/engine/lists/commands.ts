import {publishEvent} from "src/engine/network/utils"

export const publishPersonList = (name, tags) => publishEvent(30000, {tags: [["d", name], ...tags]})

export const publishBookmarksList = (name, tags) =>
  publishEvent(30001, {tags: [["d", name], ...tags]})
