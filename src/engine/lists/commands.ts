import {pubkey} from "src/engine/session/state"
import {publishEvent} from "src/engine/network/utils"
import {publishDeletion} from "src/engine/notes/commands"

export const publishBookmarksList = (id, name, tags) => {
  publishEvent(30003, {tags: [["d", id], ["name", name], ...tags]})

  // migrate away from kind 30001
  publishDeletion([`30001:${pubkey.get()}:${name}`])
}
