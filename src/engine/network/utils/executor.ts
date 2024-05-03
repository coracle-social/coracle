import {max, prop, omit, partition, equals} from "ramda"
import {sleep, pickVals} from "hurdak"
import {Worker} from "@welshman/lib"
import {createEvent, FEED, Relay} from "@welshman/util"
import {
  Plex,
  Relays,
  Executor,
  Multi,
  NetworkContext,
  Tracker,
  publish as basePublish,
  subscribe as baseSubscribe,
} from "@welshman/net"
import type {PublishRequest, SubscribeRequest} from "@welshman/net"
import {LOCAL_RELAY_URL, isGiftWrap, generatePrivateKey} from "src/util/nostr"
import {env, pubkey} from "src/engine/session/state"
import {getSetting} from "src/engine/session/utils"
import {signer, canSign} from "src/engine/session/derived"
import type {Event} from "src/engine/events/model"
import {publishes} from "src/engine/events/state"
import {LocalTarget} from "./targets"

export const relay = new Relay()

export const tracker = new Tracker()

export const projections = new Worker<Event>({
  getKey: prop("kind"),
})

projections.addGlobalHandler(event => {
  if (event.kind === FEED) {
    relay.put(event)
  }
})

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

  sub.emitter.on("event", (url: string, event: Event) => {
    if (!relay.has(event.id)) {
      projections.push(event)
    }

    request.onEvent?.(event)
  })

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

export const publish = (request: PublishRequest) => {
  const pub = basePublish(request)

  // Make sure the event gets into projections asap
  projections.push(request.event)

  // Listen to updates and update our publish queue
  if (isGiftWrap(request.event) || request.event.pubkey === pubkey.get()) {
    const pubInfo = omit(["emitter", "result"], pub)

    pub.emitter.on("*", t => publishes.key(pubInfo.id).set(pubInfo))
  }

  return pub
}

export const sign = (template, opts: {anonymous?: boolean; sk?: string}) => {
  if (opts.anonymous) {
    return signer.get().signWithKey(template, generatePrivateKey())
  }

  if (opts.sk) {
    return signer.get().signWithKey(template, opts.sk)
  }

  return signer.get().signAsUser(template)
}

export type CreateAndPublishOpts = {
  kind: number
  relays: string[]
  tags?: string[][]
  content?: string
  anonymous?: boolean
  sk?: string
  timeout?: number
  verb?: "EVENT" | "AUTH"
}

export const createAndPublish = async ({
  kind,
  relays,
  tags = [],
  content = "",
  anonymous,
  sk,
  timeout,
  verb,
}: CreateAndPublishOpts) => {
  const template = createEvent(kind, {content, tags})
  const event = await sign(template, {anonymous, sk})

  return publish({event, relays, timeout, verb})
}

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
