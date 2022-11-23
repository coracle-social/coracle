import {get} from "svelte/store"
import {Buffer} from "buffer"
import {pickValues, switcherFn} from "hurdak/lib/hurdak"
import keys from "src/util/keys"
import {db} from "src/adapters/mock/db"
import {user} from "src/adapters/mock/user"

export const broadcastNewEvent = async (topic, payload) => {
  const event = await initEvent(topic, payload)

  try {
    await broadcast(event)
  } catch (e) {
    console.error("Failed to broadcast new event", e)
  }
}

const initEvent = async (topic, payload) => {
  const {pubKey, instance} = get(user)
  const ord = await db.events.where({pubKey}).count()

  return {
    topic,
    pubKey,
    instance,
    path: [],
    ordinal: ord,
    payload: JSON.stringify(payload),
    synchronized: [],
    gid: [pubKey, instance, ord].join("."),
  }
}

export const broadcast = async event => {
  const signedEvent = await signEvent(event)
  const servers = await db.servers.toArray()

  if (event.pubKey === get(user).pubKey) {
    await db.events.put(signedEvent)
  }

  await processEvent(signedEvent)

  await Promise.all(servers.map(({url}) => req("POST", url, "/publish", {events: [signedEvent]})))
}

export const signEvent = async event => {
  const {privKey, pubKey} = get(user)

  return {
    ...event,
    path: event.path.concat({
      pubKey,
      timestamp: new Date().toISOString(),
      signature: await keys.sign(await hashEvent(event), privKey),
    }),
  }
}

export const hashEvent = async event => {
  let payload = pickValues(["topic", "payload", "instance", "ordinal"], event).join("")

  for (let part of event["path"]) {
    payload += pickValues(["pubKey", "timestamp", "signature"], part).join("")
  }

  const hash = await crypto.subtle.digest("SHA-256", _encoder.encode(payload))

  return Buffer.from(hash).toString("hex")
}

export const processEvent = async event => {
  const payload = JSON.parse(event.payload)

  console.log("processing event", {...event, payload})

  event.path.forEach(async ({signature, pubKey}, i) => {
    const hash = await hashEvent({...event, path: event.path.slice(0, i)})

    if (!(await keys.verify(signature, hash, pubKey))) {
      console.warn(`Event failed to validate: ${event.gid} at signature #${i}`)
    }
  })

  if (event.pubKey === get(user).pubKey) {
    await switcherFn(event.topic, {
      "post/create": () => db.posts.put({...payload, gid: event.gid}),
      default: () => console.warn(`Unrecognized event topic: ${event.topic}`),
    })
  }
}

export const req = async (method, url, path, {json, body} = {}) => {
  const $user = get(user)
  const headers = {}

  if (json) {
    headers["Content-Type"] = "application/json"
    body = JSON.stringify(json)
  }

  if ($user) {
    const {privKey, pubKey} = $user
    const prep = x => btoa(JSON.stringify(x))
    const header = prep({typ: "JWT", alg: "secp256k1"})
    const meta = prep({iss: pubKey, exp: new Date().valueOf() + 1000, aud: url})
    const payload = Buffer.from(_encoder.encode([header, meta].join(".")))
    const signature = btoa(await keys.sign(payload.toString("hex"), privKey))
    const jwt = [header, meta, signature].join(".")

    headers["Authorization"] = `Bearer ${jwt}`
  }

  return fetch(`${url}${path}`, {method, body, headers})
}

const _encoder = new TextEncoder()
