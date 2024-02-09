import {equals} from "ramda"
import type {EventTemplate} from "nostr-tools"
import {nip04, finalizeEvent} from "nostr-tools"
import {Emitter, now, Subscription, createEvent} from "paravel"
import {randomId, sleep} from "hurdak"
import {NostrConnect} from "nostr-tools/kinds"
import logger from "src/util/logger"
import {getPublicKey} from "src/util/nostr"
import {tryJson} from "src/util/misc"
import type {Event} from "src/engine/events/model"
import {Publisher} from "./publish"
import {subscribePersistent} from "./subscribe"
import type {NostrConnectHandler} from "../model"

let singleton: NostrConnectBroker

export class NostrConnectBroker extends Emitter {
  #sub: typeof Subscription
  #ready = sleep(500)

  static get(pubkey, connectKey: string, handler: NostrConnectHandler) {
    if (
      singleton?.pubkey !== pubkey ||
      singleton?.connectKey !== connectKey ||
      !equals(singleton?.handler, handler)
    ) {
      singleton?.teardown()
      singleton = new NostrConnectBroker(pubkey, connectKey, handler)
    }

    return singleton
  }

  constructor(
    readonly pubkey: string,
    readonly connectKey: string,
    readonly handler: NostrConnectHandler,
  ) {
    super()

    this.#sub = subscribePersistent({
      relays: this.handler.relays,
      filters: [
        {
          since: now() - 30,
          kinds: [NostrConnect],
          "#p": [getPublicKey(this.connectKey)],
        },
      ],
      onEvent: async (e: Event) => {
        const json = await nip04.decrypt(this.connectKey, e.pubkey, e.content)
        const {id, result, error} = tryJson(() => JSON.parse(json)) || {error: "invalid-response"}

        logger.info("NostrConnect response:", {id, result, error})

        if (result === "auth_url") {
          window.open(error, "Coracle", "width=600,height=800,popup=yes")
        } else {
          this.emit(`response-${id}`, {result, error})
        }
      },
    })
  }

  async request(method: string, params: string[], admin = false) {
    // nsecbunker has a race condition
    await this.#ready

    const id = randomId()
    const pubkey = admin ? this.handler.pubkey : this.pubkey
    const payload = JSON.stringify({id, method, params})
    const content = await nip04.encrypt(this.connectKey, pubkey, payload)
    const template = createEvent(NostrConnect, {content, tags: [["p", pubkey]]})
    const event = finalizeEvent(template, this.connectKey as any)

    logger.info("NostrConnect request:", {id, method, params})

    Publisher.publish({event, relays: this.handler.relays, silent: true})

    return new Promise((resolve, reject) => {
      this.once(`response-${id}`, ({result, error}) => {
        if (error) {
          reject(error)
        } else {
          resolve(result)
        }
      })
    })
  }

  createAccount(username: string) {
    if (!this.handler.domain) {
      throw new Error("Unable to create an account without a handler domain")
    }

    return this.request("create_account", [username, this.handler.domain], true)
  }

  async connect(token: string = null) {
    const params = [getPublicKey(this.connectKey)]

    if (token) {
      params.push(token)
    }

    const result = await this.request("connect", params)

    return result === "ack"
  }

  signEvent(event: EventTemplate) {
    return tryJson(async () => {
      const res = (await this.request("sign_event", [JSON.stringify(event)])) as string

      return JSON.parse(res)
    })
  }

  nip04Encrypt(pk: string, message: string) {
    return this.request("nip04_encrypt", [pk, message])
  }

  nip04Decrypt(pk: string, message: string) {
    return this.request("nip04_decrypt", [pk, message])
  }

  nip44Encrypt(pk: string, message: string) {
    return this.request("nip44_encrypt", [pk, message])
  }

  nip44Decrypt(pk: string, message: string) {
    return this.request("nip44_decrypt", [pk, message])
  }

  teardown() {
    this.sub?.close()
  }
}
