import {partition} from "ramda"
import {noop, sleep} from "hurdak"
import {Emitter, Plex, Relays, Executor, Multi} from "paravel"
import {error, warn} from "src/util/logger"
import {normalizeRelayUrl} from "src/util/nostr"
import {writable} from "src/engine/util"
import {env, pool, events} from "src/engine/state"
import {getSetting, matchFilters} from "src/engine/queries"

export const authHandler = writable(null)

export const getUrls = (relays: string[]) => {
  const {FORCE_RELAYS} = env.get()

  if (FORCE_RELAYS?.length > 0) {
    return FORCE_RELAYS
  }

  if (relays.length === 0) {
    error(`Attempted to connect to zero urls`)
  }

  const urls = new Set(relays.map(normalizeRelayUrl))

  if (urls.size !== relays.length) {
    warn(`Attempted to connect to non-unique relays`)
  }

  return Array.from(urls)
}

export const getTarget = (urls: string[]) => {
  const [localUrls, remoteUrls] = partition(url => url.startsWith("local://"), urls)
  const muxUrl = getSetting("multiplextr_url")

  // Try to use our multiplexer, but if it fails to connect fall back to relays. If
  // we're only connecting to a single relay, just do it directly, unless we already
  // have a connection to the multiplexer open, in which case we're probably doing
  // AUTH with a single relay.
  let target

  if (muxUrl && (remoteUrls.length > 1 || pool.has(muxUrl))) {
    const connection = pool.get(muxUrl)

    if (connection.socket.isHealthy()) {
      target = new Plex(remoteUrls, connection)
    }
  } else {
    target = new Relays(remoteUrls.map(url => pool.get(url)))
  }

  return localUrls.length > 0 ? new Multi([target, new LocalTarget()]) : target
}

export const getExecutor = (urls: string[]) => {
  const target = getTarget(urls)
  const executor = new Executor(target)
  const onAuth = authHandler.get()

  if (onAuth) {
    executor.handleAuth({onAuth, onOk: noop})
  }

  return executor
}

export class LocalTarget extends Emitter {
  constructor() {
    super()

    this.setMaxListeners(100)
  }

  get connections() {
    return []
  }

  async onREQ(subId, ...filters) {
    // Make sure this is async, listeners don't otherwise get attached
    await sleep(10)

    if (filters.length === 1 && filters[0].ids) {
      for (const id of filters[0].ids) {
        const event = events.key(id).get()

        if (event) {
          this.emit("EVENT", "local://coracle.relay", subId, event)
        }
      }
    } else {
      for (const event of events.get()) {
        if (matchFilters(filters, event)) {
          this.emit("EVENT", "local://coracle.relay", subId, event)
        }
      }
    }
  }

  send(verb, subid, ...args) {
    if (verb === "REQ") {
      this.onREQ(subid, ...args)
    }
  }

  cleanup = () => {
    this.removeAllListeners()
  }
}
