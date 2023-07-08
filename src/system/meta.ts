import {Socket} from "paravel"
import {Table} from "src/util/loki"
import {switcher} from "hurdak/lib/hurdak"

export default ({network}) => {
  const relayStats = new Table("meta/relayStats", "url")

  network.pool.on("open", ({url}) => {
    relayStats.patch({url, last_opened: Date.now(), last_activity: Date.now()})
  })

  network.pool.on("close", ({url}) => {
    relayStats.patch({url, last_closed: Date.now(), last_activity: Date.now()})
  })

  network.pool.on("error:set", (url, error) => {
    relayStats.patch({url, error})
  })

  network.pool.on("error:clear", url => {
    relayStats.patch({url, error: null})
  })

  network.on("publish", urls => {
    relayStats.patch(
      urls.map(url => ({
        url,
        last_publish: Date.now(),
        last_activity: Date.now(),
      }))
    )
  })

  network.on("sub:open", urls => {
    for (const url of urls) {
      const stats = relayStats.get(url)

      relayStats.patch({
        url,
        last_sub: Date.now(),
        last_activity: Date.now(),
        total_subs: (stats?.total_subs || 0) + 1,
        active_subs: (stats?.active_subs || 0) + 1,
      })
    }
  })

  network.on("sub:close", urls => {
    for (const url of urls) {
      const stats = relayStats.get(url)

      relayStats.patch({
        url,
        last_activity: Date.now(),
        active_subs: stats.active_subs - 1,
      })
    }
  })

  network.on("event", url => {
    const stats = relayStats.get(url)

    relayStats.patch({
      url,
      last_activity: Date.now(),
      events_count: (stats.events_count || 0) + 1,
    })
  })

  network.on("eose", (url, ms) => {
    const stats = relayStats.get(url)

    relayStats.patch({
      url,
      last_activity: Date.now(),
      eose_count: (stats.eose_count || 0) + 1,
      eose_timer: (stats.eose_timer || 0) + ms,
    })
  })

  network.on("timeout", (url, ms) => {
    const stats = relayStats.get(url)

    relayStats.patch({
      url,
      last_activity: Date.now(),
      timeouts: (stats.timeouts || 0) + 1,
    })
  })

  const getRelayQuality = url => {
    const stats = relayStats.get(url)

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

    const {timeouts, subs_count: subsCount, eose_timer: eoseTimer, eose_count: eoseCount} = stats
    const timeoutRate = timeouts > 0 ? timeouts / subsCount : null
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

    if (network.pool.get(url).status === Socket.STATUS.READY) {
      return [1, "Connected"]
    }

    return [0.5, "Not Connected"]
  }

  return {
    relayStats,
    getRelayQuality,
  }
}
