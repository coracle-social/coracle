import {debounce} from "throttle-debounce"
import {load} from "src/engine/network/utils"
import {getUserHints} from "src/engine/relays/utils"
import {searchableRelays} from "src/engine/relays/derived"
import {people} from "./state"

export const loadPeople = debounce(500, search => {
  // If we have a query, search using nostr.band. If not, ask for random profiles.
  // This allows us to populate results even if search isn't supported by forced urls
  if (search.length > 2) {
    load({
      relays: searchableRelays.get(),
      filters: [{kinds: [0], search, limit: 10}],
    })
  } else if (people.get().length < 50) {
    load({
      relays: getUserHints("read"),
      filters: [{kinds: [0], limit: 50}],
    })
  }
})
