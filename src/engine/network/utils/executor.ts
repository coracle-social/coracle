import {partition} from "ramda"
import {noop} from "hurdak"
import {Plex, Relays, Executor, Multi} from "paravel"
import {error, warn} from "src/util/logger"
import {normalizeRelayUrl} from "src/engine/relays/utils"
import {env} from "src/engine/session/state"
import {pool} from "src/engine/network/state"
import {getSetting} from "src/engine/session/utils"
import {signer, canSign} from "src/engine/session/derived"
import {LocalTarget} from "./targets"
import {buildEvent} from "./publish"

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

const seenChallenges = new Set()

export const onAuth = async (url, challenge) => {
  if (canSign.get() && !seenChallenges.has(challenge)) {
    seenChallenges.add(challenge)

    const event = await signer.get().signAsUser(
      buildEvent(22242, {
        tags: [
          ["challenge", challenge],
          ["relay", url],
        ],
      })
    )

    pool.get(url).send(["AUTH", event])

    return event
  }
}

export const getExecutor = (urls: string[]) => {
  const target = getTarget(urls)
  const executor = new Executor(target)

  executor.handleAuth({onAuth, onOk: noop})

  return executor
}
