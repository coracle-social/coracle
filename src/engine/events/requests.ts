import {prop} from "ramda"
import {sumBy} from "src/util/misc"
import {sessions} from "src/engine/session/state"
import {getUserRelayUrls} from "src/engine/relays/utils"
import {load} from "src/engine/network/utils"
import {deletes} from "./state"

export const loadDeletes = () => {
  const since = sumBy(prop("created_at"), deletes.get().filter(prop("created_at"))) || 0
  const authors = Object.values(sessions.get()).map(prop("pubkey"))

  return load({
    relays: getUserRelayUrls("write"),
    filters: [{kinds: [5], authors, since}],
  })
}
