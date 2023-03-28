import {pluck} from "ramda"
import {first} from "hurdak/lib/hurdak"
import {writable} from "svelte/store"
import pool from "src/agent/pool"
import {getUserRelays} from "src/agent/relays"

export const slowConnections = writable([])

setInterval(() => {
  // Only notify about relays the user is actually subscribed to
  const relayUrls = new Set(pluck("url", getUserRelays()))

  // Prune connections we haven't used in a while
  Object.entries(pool.Meta.stats)
    .filter(([url, stats]) => stats.lastRequest < Date.now() - 60_000)
    .forEach(([url, stats]) => pool.disconnect(url))

  // Alert the user to any heinously slow connections
  slowConnections.set(
    Object.keys(pool.Meta.stats).filter(
      url => relayUrls.has(url) && first(pool.getQuality(url)) < 0.3
    )
  )
}, 30_000)
