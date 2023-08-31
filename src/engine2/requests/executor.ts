import {noop} from "hurdak"
import {Plex, Relays, Executor} from "paravel"
import {error, warn} from "src/util/logger"
import {normalizeRelayUrl} from "src/util/nostr"
import {writable} from "src/engine2/util"
import {env, settings} from "src/engine2/state"
import {pool} from "./pool"

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

export const getExecutor = (urls: string[], {bypassBoot = false} = {}) => {
  let target

  const {multiplextr_url: muxUrl} = settings.get()

  // Try to use our multiplexer, but if it fails to connect fall back to relays. If
  // we're only connecting to a single relay, just do it directly, unless we already
  // have a connection to the multiplexer open, in which case we're probably doing
  // AUTH with a single relay.
  if (muxUrl && (urls.length > 1 || pool.has(muxUrl))) {
    const connection = pool.get(muxUrl)

    if (connection.socket.isHealthy()) {
      target = new Plex(urls, connection)
    }
  }

  if (!target) {
    target = new Relays(urls.map(url => pool.get(url)))
  }

  const executor = new Executor(target)
  const onAuth = authHandler.get()

  if (onAuth) {
    executor.handleAuth({onAuth, onOk: noop})
  }

  return executor
}
