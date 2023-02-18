import {pluck} from 'ramda'
import {first} from 'hurdak/lib/hurdak'
import {writable} from 'svelte/store'
import pool from 'src/agent/pool'
import {getUserRelays} from 'src/agent/relays'

export const slowConnections = writable([])

setInterval(() => {
  // Only notify about relays the user is actually subscribed to
  const relayUrls = new Set(pluck('url', getUserRelays()))

  // Prune connections we haven't used in a while
  pool.getConnections()
    .filter(conn => conn.lastRequest < Date.now() - 60_000)
    .forEach(conn => conn.disconnect())

  // Alert the user to any heinously slow connections
  slowConnections.set(
    pool.getConnections()
      .filter(c => relayUrls.has(c.nostr.url) && first(c.getQuality()) < 0.3)
  )
}, 30_000)
