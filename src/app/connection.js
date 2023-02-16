import {pluck} from 'ramda'
import {first} from 'hurdak/lib/hurdak'
import {log} from 'src/util/logger'
import {writable} from 'svelte/store'
import pool from 'src/agent/pool'
import {getUserRelays} from 'src/agent/relays'

export const slowConnections = writable([])

setInterval(() => {
  // Only notify about relays the user is actually subscribed to
  const relayUrls = pluck('url', getUserRelays())

  // Prune connections we haven't used in a while
  pool.getConnections()
    .filter(conn => conn.lastRequest < Date.now() - 60_000)
    .forEach(conn => conn.disconnect())

  // Log stats for debugging purposes
  log(
    'Connection stats',
    pool.getConnections()
      .map(c => `${c.nostr.url} ${c.getQuality().join(' ')}`)
  )

  // Alert the user to any heinously slow connections
  slowConnections.set(
    pool.getConnections()
      .filter(c => relayUrls.includes(c.nostr.url) && first(c.getQuality()) < 0.3)
  )
}, 30_000)
