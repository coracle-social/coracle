import {pubkey} from "src/engine/session/state"
import {createAndPublish, getClientTags} from "src/engine/network/utils"
import {forcePlatformRelays, hints} from "src/engine/relays/utils"
import {publishDeletion} from "src/engine/notes/commands"

export const publishBookmarksList = (id, title, description, tags) => {
  createAndPublish({
    kind: 30003,
    tags: [
      ["d", id],
      ["name", title],
      ["title", title],
      ["description", description],
      ...getClientTags(),
      ...tags,
    ],
    relays: forcePlatformRelays(hints.WriteRelays().getUrls()),
  })

  // migrate away from kind 30001
  publishDeletion([`30001:${pubkey.get()}:${id}`])
  publishDeletion([`30001:${pubkey.get()}:${title}`])
}

export const publishCommunitiesList = addresses =>
  createAndPublish({
    kind: 10004,
    tags: [...addresses.map(a => ["a", a]), ...getClientTags()],
    relays: forcePlatformRelays(hints.WriteRelays().getUrls()),
  })
