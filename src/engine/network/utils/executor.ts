import {max, uniq, partition, equals} from "ramda"
import {sleep, pickVals} from "hurdak"
import type {Event} from "nostr-tools"
import {createEvent} from "@coracle.social/util"
import {
  Plex,
  Relays,
  Executor,
  Multi,
  NetworkContext,
  Tracker,
  subscribe as baseSubscribe,
} from "@coracle.social/network"
import type {SubscribeRequest} from "@coracle.social/network"
import {error, warn} from "src/util/logger"
import {LOCAL_RELAY_URL} from "src/util/nostr"
import {normalizeRelayUrl} from "src/engine/relays/utils"
import {env} from "src/engine/session/state"
import {getSetting} from "src/engine/session/utils"
import {signer, canSign} from "src/engine/session/derived"
import {LocalTarget} from "./targets"

export const tracker = new Tracker()

export const getExecutor = (urls: string[]) => {
  const muxUrl = getSetting("multiplextr_url")
  const [localUrls, remoteUrls] = partition(equals(LOCAL_RELAY_URL), urls)

  // Try to use our multiplexer, but if it fails to connect fall back to relays. If
  // we're only connecting to a single relay, just do it directly, unless we already
  // have a connection to the multiplexer open, in which case we're probably doing
  // AUTH with a single relay.
  let target

  if (muxUrl && (remoteUrls.length > 1 || NetworkContext.pool.has(muxUrl))) {
    const connection = NetworkContext.pool.get(muxUrl)

    if (connection.socket.isHealthy()) {
      target = new Plex(remoteUrls, connection)
    }
  }

  if (!target) {
    target = new Relays(remoteUrls.map(url => NetworkContext.pool.get(url)))
  }

  if (localUrls.length > 0) {
    target = new Multi([target, new LocalTarget()])
  }

  return new Executor(target)
}

const seenChallenges = new Set()

export const onAuth = async (url, challenge) => {
  const {FORCE_GROUP, PLATFORM_RELAYS} = env.get()

  if (!canSign.get()) {
    return
  }

  if (seenChallenges.has(challenge)) {
    return
  }

  if (!FORCE_GROUP && PLATFORM_RELAYS.length === 0 && !getSetting("auto_authenticate")) {
    return
  }

  seenChallenges.add(challenge)

  const event = await signer.get().signAsUser(
    createEvent(22242, {
      tags: [
        ["relay", url],
        ["challenge", challenge],
      ],
    }),
  )

  NetworkContext.pool.get(url).send(["AUTH", event])

  return event
}

export type MySubscribeRequest = SubscribeRequest & {
  onEvent?: (event: Event) => void
  onComplete?: () => void
  skipCache?: boolean
}

export const subscribe = (request: MySubscribeRequest) => {
  if (!request.skipCache) {
    request.relays = request.relays.concat(LOCAL_RELAY_URL)
  }

  const sub = baseSubscribe(request)

  if (request.onEvent) {
    sub.emitter.on("event", (url: string, event: Event) => request.onEvent(event))
  }

  if (request.onComplete) {
    sub.emitter.on("complete", request.onComplete)
  }

  return sub
}

export const subscribePersistent = async (request: MySubscribeRequest) => {
  /* eslint no-constant-condition: 0 */
  while (true) {
    // If the subscription gets closed quickly due to eose, don't start flapping
    await Promise.all([
      sleep(30_000),
      new Promise(resolve => subscribe(request).emitter.on("close", resolve)),
    ])
  }
}

export const LOAD_OPTS = {timeout: 3000, closeOnEose: true}

export const load = (request: MySubscribeRequest) => subscribe({...request, ...LOAD_OPTS}).result

export const loadOne = (request: MySubscribeRequest) =>
  new Promise<Event | null>(resolve => {
    const sub = subscribe({...request, ...LOAD_OPTS})

    sub.emitter.on("event", (url: string, event: Event) => {
      resolve(event)
      sub.close()
    })

    sub.emitter.on("complete", () => {
      resolve(null)
    })
  })

setInterval(() => {
  const activityKeys = ["lastRequest", "lastPublish", "lastEvent"]

  for (const [url, con] of NetworkContext.pool.data.entries()) {
    // @ts-ignore
    const lastActivity: number = pickVals(activityKeys, con.meta).reduce(max)

    // If our connection hasn't been used in a while, close it and reopen
    if (lastActivity && lastActivity < Date.now() - 30_000) {
      NetworkContext.pool.remove(url)
    }
  }
}, 10_000)
