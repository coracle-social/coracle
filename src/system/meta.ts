import {Socket} from "paravel"
import {now} from "src/util/misc"
import {switcher} from "hurdak/lib/hurdak"
import type {System} from "src/system/system"
import type {RelayStat} from "src/system/types"

export class Meta {
  system: System
  relayStats: Record<string, RelayStat>
  constructor(system) {
    this.system = system

    this.relayStats = {}

    system.network.pool.on("open", ({url}) => {
      this.updateRelayStats(url, {last_opened: now(), last_activity: now()})
    })

    system.network.pool.on("close", ({url}) => {
      this.updateRelayStats(url, {last_closed: now(), last_activity: now()})
    })

    system.network.pool.on("error:set", (url, error) => {
      this.updateRelayStats(url, {error})
    })

    system.network.pool.on("error:clear", url => {
      this.updateRelayStats(url, {error: null})
    })

    system.network.on("publish", urls => {
      for (const url of urls) {
        this.updateRelayStats(url, {
          last_publish: now(),
          last_activity: now(),
        })
      }
    })

    system.network.on("sub:open", urls => {
      for (const url of urls) {
        const stats = this.getRelayStats(url)

        this.updateRelayStats(url, {
          last_sub: now(),
          last_activity: now(),
          total_subs: (stats?.total_subs || 0) + 1,
          active_subs: (stats?.active_subs || 0) + 1,
        })
      }
    })

    system.network.on("sub:close", urls => {
      for (const url of urls) {
        const stats = this.getRelayStats(url)

        this.updateRelayStats(url, {
          last_activity: now(),
          active_subs: stats ? stats.active_subs - 1 : 0,
        })
      }
    })

    system.network.on("event", ({url}) => {
      const stats = this.getRelayStats(url)

      this.updateRelayStats(url, {
        last_activity: now(),
        events_count: (stats.events_count || 0) + 1,
      })
    })

    system.network.on("eose", (url, ms) => {
      const stats = this.getRelayStats(url)

      this.updateRelayStats(url, {
        last_activity: now(),
        eose_count: (stats.eose_count || 0) + 1,
        eose_timer: (stats.eose_timer || 0) + ms,
      })
    })

    system.network.on("timeout", (url, ms) => {
      const stats = this.getRelayStats(url)

      this.updateRelayStats(url, {
        last_activity: now(),
        timeouts: (stats.timeouts || 0) + 1,
      })
    })
  }

  getRelayStats = url => this.relayStats[url]

  updateRelayStats = (url, updates) => {
    const stats = this.getRelayStats(url)

    this.relayStats[url] = {...stats, ...updates}
  }

  getRelayQuality = url => {
    const stats = this.getRelayStats(url)

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

    if (this.system.network.pool.get(url).status === Socket.STATUS.READY) {
      return [1, "Connected"]
    }

    return [0.5, "Not Connected"]
  }
}
