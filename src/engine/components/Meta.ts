import {Socket} from "paravel"
import {now} from "src/util/misc"
import {switcher} from "hurdak/lib/hurdak"
import type {RelayStat} from "src/system/types"
import {collection} from "../util/store"

export function contributeState() {
  const relayStats = collection<RelayStat>()

  return {relayStats}
}

export function contributeActions({Meta, Network}) {
  const getRelayStats = url => Meta.relayStats.getKey(url)

  const getRelayQuality = url => {
    const stats = getRelayStats(url)

    if (!stats) {
      return [0.5, "Not Connected"]
    }

    if (stats.error) {
      return [
        0,
        switcher(stats.error, {
          disconnected: "Disconnected",
          unauthorized: "Logging in",
          forbidden: "Failed to log in",
        }),
      ]
    }

    const {timeouts, total_subs: totalSubs, eose_timer: eoseTimer, eose_count: eoseCount} = stats
    const timeoutRate = timeouts > 0 ? timeouts / totalSubs : null
    const eoseQuality = eoseCount > 0 ? Math.max(1, 500 / (eoseTimer / eoseCount)) : null

    if (timeoutRate && timeoutRate > 0.5) {
      return [1 - timeoutRate, "Slow connection"]
    }

    if (eoseQuality && eoseQuality < 0.7) {
      return [eoseQuality, "Slow connection"]
    }

    if (eoseQuality) {
      return [eoseQuality, "Connected"]
    }

    if (Network.pool.get(url).status === Socket.STATUS.READY) {
      return [1, "Connected"]
    }

    return [0.5, "Not Connected"]
  }

  return {getRelayStats, getRelayQuality}
}

export function initialize({Network, Meta}) {
  Network.pool.on("open", ({url}) => {
    Meta.relayStats.mergeKey(url, {last_opened: now(), last_activity: now()})
  })

  Network.pool.on("close", ({url}) => {
    Meta.relayStats.mergeKey(url, {last_closed: now(), last_activity: now()})
  })

  Network.pool.on("error:set", (url, error) => {
    Meta.relayStats.mergeKey(url, {error})
  })

  Network.pool.on("error:clear", url => {
    Meta.relayStats.mergeKey(url, {error: null})
  })

  Network.emitter.on("publish", urls => {
    for (const url of urls) {
      Meta.relayStats.mergeKey(url, {
        last_publish: now(),
        last_activity: now(),
      })
    }
  })

  Network.emitter.on("sub:open", urls => {
    for (const url of urls) {
      const stats = Meta.getRelayStats(url)

      Meta.relayStats.mergeKey(url, {
        last_sub: now(),
        last_activity: now(),
        total_subs: (stats?.total_subs || 0) + 1,
        active_subs: (stats?.active_subs || 0) + 1,
      })
    }
  })

  Network.emitter.on("sub:close", urls => {
    for (const url of urls) {
      const stats = Meta.getRelayStats(url)

      Meta.relayStats.mergeKey(url, {
        last_activity: now(),
        active_subs: stats ? stats.active_subs - 1 : 0,
      })
    }
  })

  Network.emitter.on("event", ({url}) => {
    const stats = Meta.getRelayStats(url)

    Meta.relayStats.mergeKey(url, {
      last_activity: now(),
      events_count: (stats.events_count || 0) + 1,
    })
  })

  Network.emitter.on("eose", (url, ms) => {
    const stats = Meta.getRelayStats(url)

    Meta.relayStats.mergeKey(url, {
      last_activity: now(),
      eose_count: (stats.eose_count || 0) + 1,
      eose_timer: (stats.eose_timer || 0) + ms,
    })
  })

  Network.emitter.on("timeout", (url, ms) => {
    const stats = Meta.getRelayStats(url)

    Meta.relayStats.mergeKey(url, {
      last_activity: now(),
      timeouts: (stats.timeouts || 0) + 1,
    })
  })
}
