import {max, without, uniq, partition, equals} from "ramda"
import {noop, pickVals} from "hurdak"
import {Plex, Relays, Executor, Multi, createEvent} from "paravel"
import {error, warn} from "src/util/logger"
import {LOCAL_RELAY_URL} from "src/util/nostr"
import {normalizeRelayUrl} from "src/engine/relays/utils"
import {pool} from "src/engine/network/state"
import {env} from "src/engine/session/state"
import {getSetting} from "src/engine/session/utils"
import {signer, canSign} from "src/engine/session/derived"
import {LocalTarget} from "./targets"

export const getUrls = (relays: string[]) => {
  if (relays.length === 0) {
    error(`Attempted to connect to zero urls`)
  }

  const urls = uniq(relays.map(normalizeRelayUrl))

  if (urls.length !== relays.length) {
    warn(`Attempted to connect to non-unique relays`)
  }

  const {FORCE_RELAYS} = env.get()
  const nonLocalRelays = without([LOCAL_RELAY_URL], urls)

  if (FORCE_RELAYS.length > 0 && nonLocalRelays.some(url => !FORCE_RELAYS.includes(url))) {
    warn(`Attempted to connect to something other than FORCE_RELAYS`, urls)
  }

  return urls
}

export const getTarget = (urls: string[]) => {
  const muxUrl = getSetting("multiplextr_url")
  const [localUrls, remoteUrls] = partition(equals(LOCAL_RELAY_URL), urls)

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
  }

  if (!target) {
    target = new Relays(remoteUrls.map(url => pool.get(url)))
  }

  if (localUrls.length > 0) {
    target = new Multi([target, new LocalTarget()])
  }

  return target
}

const seenChallenges = new Set()

export const onAuth = async (url, challenge) => {
  const {FORCE_GROUP, FORCE_RELAYS} = env.get()

  if (!canSign.get()) {
    return
  }

  if (seenChallenges.has(challenge)) {
    return
  }

  if (!FORCE_GROUP && FORCE_RELAYS.length === 0 && !getSetting("auto_authenticate")) {
    return
  }

  seenChallenges.add(challenge)

  const event = await signer.get().signAsUser(
    createEvent(22242, {
      tags: [
        ["challenge", challenge],
        ["relay", url],
      ],
    }),
  )

  pool.get(url).send(["AUTH", event])

  return event
}

export const getExecutor = (urls: string[]) => {
  const target = getTarget(urls)
  const executor = new Executor(target)

  executor.handleAuth({onAuth, onOk: noop})

  return executor
}

setInterval(() => {
  const activityKeys = ["lastRequest", "lastPublish", "lastEvent"]

  for (const [url, con] of pool.data.entries()) {
    // @ts-ignore
    const lastActivity = pickVals(activityKeys, con.meta).reduce(max)

    // If our connection hasn't been used in a while, close it and reopen
    if (lastActivity && lastActivity < Date.now() - 60_000) {
      pool.remove(url)
    }
  }
}, 10_000)
