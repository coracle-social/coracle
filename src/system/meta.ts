import {Socket} from "paravel"
import {now} from "src/util/misc"
import {Table} from "src/util/loki"
import {switcher} from "hurdak/lib/hurdak"
import type {System} from "src/system/system"
import type {RelayStat} from "src/system/types"

export class Meta {
  system: System
  relayStats: Table<RelayStat>
  constructor(system) {
    this.system = system

    this.relayStats = new Table(system.key("meta/relayStats"), "url")

    system.network.pool.on("open", ({url}) => {
      this.relayStats.patch({url, last_opened: now(), last_activity: now()})
    })

    system.network.pool.on("close", ({url}) => {
      this.relayStats.patch({url, last_closed: now(), last_activity: now()})
    })

    system.network.pool.on("error:set", (url, error) => {
      this.relayStats.patch({url, error})
    })

    system.network.pool.on("error:clear", url => {
      this.relayStats.patch({url, error: null})
    })

    system.network.on("publish", urls => {
      this.relayStats.patch(
        urls.map(url => ({
          url,
          last_publish: now(),
          last_activity: now(),
        }))
      )
    })

    system.network.on("sub:open", urls => {
      for (const url of urls) {
        const stats = this.relayStats.get(url)

        this.relayStats.patch({
          url,
          last_sub: now(),
          last_activity: now(),
          total_subs: (stats?.total_subs || 0) + 1,
          active_subs: (stats?.active_subs || 0) + 1,
        })
      }
    })

    system.network.on("sub:close", urls => {
      for (const url of urls) {
        const stats = this.relayStats.get(url)

        this.relayStats.patch({
          url,
          last_activity: now(),
          active_subs: stats ? stats.active_subs - 1 : 0,
        })
      }
    })

    system.network.on("event", ({url}) => {
      const stats = this.relayStats.get(url)

      this.relayStats.patch({
        url,
        last_activity: now(),
        events_count: (stats.events_count || 0) + 1,
      })
    })

    system.network.on("eose", (url, ms) => {
      const stats = this.relayStats.get(url)

      this.relayStats.patch({
        url,
        last_activity: now(),
        eose_count: (stats.eose_count || 0) + 1,
        eose_timer: (stats.eose_timer || 0) + ms,
      })
    })

    system.network.on("timeout", (url, ms) => {
      const stats = this.relayStats.get(url)

      this.relayStats.patch({
        url,
        last_activity: now(),
        timeouts: (stats.timeouts || 0) + 1,
      })
    })
  }

  getRelayQuality = url => {
    const stats = this.relayStats.get(url)

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
