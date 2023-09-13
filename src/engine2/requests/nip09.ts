import {prop} from "ramda"
import {sumBy} from "src/util/misc"
import {sessions, deletes} from "src/engine2/state"
import {getUserRelayUrls} from "src/engine2/queries"
import {load} from "./load"

export const loadDeletes = () => {
  const since = sumBy(prop("created_at"), deletes.get().filter(prop("created_at"))) || 0
  const authors = Object.values(sessions.get()).map(prop("pubkey"))

  return load({
    relays: getUserRelayUrls("write"),
    filters: [{kinds: [5], authors, since}],
  })
}
