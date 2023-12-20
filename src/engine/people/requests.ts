import {debounce} from "throttle-debounce"
import {load} from "src/engine/network/utils"
import {searchableRelays} from "src/engine/relays/derived"

export const loadPeople = debounce(500, search => {
  // Only search if we have a query
  if (search.length > 2) {
    load({
      relays: searchableRelays.get(),
      filters: [{kinds: [0], search, limit: 10}],
    })
  }
})
