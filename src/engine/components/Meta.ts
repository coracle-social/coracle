import {Socket} from "paravel"
import {now} from "src/util/misc"
import {switcher} from "hurdak"
import {collection} from "src/engine/util/store"
import type {RelayStat} from "src/engine/types"
import type {Engine} from "src/engine/Engine"
import type {Network} from "src/engine/Network"

export class Meta {
  Network: Network

  relayStats = collection<RelayStat>("url")

  getRelayStats = (url: string) => this.relayStats.key(url).get()

  getRelayQuality = (url: string): [number, string] => {
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

    if (this.Network.pool.get(url).status === Socket.STATUS.READY) {
      return [1, "Connected"]
    }

    return [0.5, "Not Connected"]
  }

  initialize(engine: Engine) {
    this.Network = engine.Network

    this.Network.pool.on("open", ({url}: {url: string}) => {
      this.relayStats.key(url).merge({last_opened: now(), last_activity: now()})
    })

    this.Network.pool.on("close", ({url}: {url: string}) => {
      this.relayStats.key(url).merge({last_closed: now(), last_activity: now()})
    })

    this.Network.pool.on("error:set", (url: string, error: string) => {
      this.relayStats.key(url).merge({error})
    })

    this.Network.pool.on("error:clear", (url: string) => {
      this.relayStats.key(url).merge({error: null})
    })

    this.Network.emitter.on("publish", (urls: string[]) => {
      for (const url of urls) {
        this.relayStats.key(url).merge({
          last_publish: now(),
          last_activity: now(),
        })
      }
    })

    this.Network.emitter.on("sub:open", (urls: string[]) => {
      for (const url of urls) {
        const stats = this.getRelayStats(url)

        this.relayStats.key(url).merge({
          last_sub: now(),
          last_activity: now(),
          total_subs: (stats?.total_subs || 0) + 1,
          active_subs: (stats?.active_subs || 0) + 1,
        })
      }
    })

    this.Network.emitter.on("sub:close", (urls: string[]) => {
      for (const url of urls) {
        const stats = this.getRelayStats(url)

        this.relayStats.key(url).merge({
          last_activity: now(),
          active_subs: stats ? stats.active_subs - 1 : 0,
        })
      }
    })

    this.Network.emitter.on("event", ({url}: {url: string}) => {
      const stats = this.getRelayStats(url)

      this.relayStats.key(url).merge({
        last_activity: now(),
        events_count: (stats.events_count || 0) + 1,
      })
    })

    this.Network.emitter.on("eose", (url: string, ms: number) => {
      const stats = this.getRelayStats(url)

      this.relayStats.key(url).merge({
        last_activity: now(),
        eose_count: (stats.eose_count || 0) + 1,
        eose_timer: (stats.eose_timer || 0) + ms,
      })
    })

    this.Network.emitter.on("timeout", (url: string, ms: number) => {
      const stats = this.getRelayStats(url)

      this.relayStats.key(url).merge({
        last_activity: now(),
        timeouts: (stats.timeouts || 0) + 1,
      })
    })
  }
}
