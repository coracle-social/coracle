import {getUserRelayUrls} from "src/engine2/queries"
import {publishEvent} from "./util"

export const publishDeletion = (ids, relays = null) =>
  publishEvent(5, {
    relays: relays || getUserRelayUrls("write"),
    tags: ids.map(id => [id.includes(":") ? "a" : "e", id]),
  })
