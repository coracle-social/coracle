import {pubkey} from "src/engine/session/state"
import {createAndPublish, getClientTags} from "src/engine/network/utils"
import {publishDeletion} from "src/engine/notes/commands"

export const publishBookmarksList = (id, title, description, tags) => {
  createAndPublish(30003, {
    tags: [
      ["d", id],
      ["name", title],
      ["title", title],
      ["description", description],
      ...getClientTags(),
      ...tags,
    ],
  })

  // migrate away from kind 30001
  publishDeletion([`30001:${pubkey.get()}:${name}`])
}

export const publishCommunitiesList = addresses =>
  createAndPublish(10004, {
    tags: [...addresses.map(a => ["a", a]), ...getClientTags()],
  })
