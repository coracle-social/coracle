import {sortBy} from "ramda"
import {Table} from "src/util/loki"

export default ({keys, sync, social}) => {
  const events = new Table("cache/events", "id", {
    max: 5000,
    sort: events => {
      const pubkey = keys.getPubkey()
      const follows = social.getUserFollowsSet()

      return sortBy(e => {
        if (e.pubkey === pubkey) return 0
        if (follows.has(e.pubkey)) return 1

        return Number.MAX_SAFE_INTEGER - e.created_at
      }, events)
    },
  })

  sync.addHandler(sync.ANY_KIND, e => {
    if (e.pubkey === keys.getPubkey() && !events.get(e.id)) {
      events.patch(e)
    }
  })

  return {events}
}
