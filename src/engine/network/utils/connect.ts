import {equals} from "ramda"
import type {EventTemplate} from "nostr-tools"
import {nip04, finalizeEvent} from "nostr-tools"
import {Emitter, now} from "@welshman/lib"
import {createEvent} from "@welshman/util"
import type {TrustedEvent} from "@welshman/util"
import type {Subscription} from "@welshman/net"
import {randomId, sleep} from "hurdak"
import {NostrConnect} from "nostr-tools/kinds"
import logger from "src/util/logger"
import {getPublicKey} from "src/util/nostr"
import {tryJson} from "src/util/misc"
import {subscribe, publish} from "./executor"
import type {NostrConnectHandler} from "../model"

let singleton: NostrConnectBroker

// FIXME set the full list of requested perms
const Perms =
  "nip04_encrypt,nip04_decrypt,sign_event:0,sign_event:1,sign_event:4,sign_event:6,sign_event:7"

export class NostrConnectBroker extends Emitter {
  #sub: Subscription
  #ready = sleep(500)
  #closed = false
  #connectResult: any

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

    this.subscribe()
  }

  subscribe() {
    this.#sub = subscribe({
      relays: this.handler.relays,
      filters: [
        {
          since: now() - 30,
          kinds: [NostrConnect],
          "#p": [getPublicKey(this.connectKey)],
        },
      ],
      onEvent: async (e: TrustedEvent) => {
        const json = await nip04.decrypt(this.connectKey, e.pubkey, e.content)
        const {id, result, error} = tryJson(() => JSON.parse(json)) || {error: "invalid-response"}

        logger.info("NostrConnect response:", {id, result, error})

        if (result === "auth_url") {
          this.emit(`auth-${id}`, error)
        } else {
          this.emit(`response-${id}`, {result, error})
        }
      },
      onComplete: () => {
        if (!this.#closed) {
          this.subscribe()
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

    publish({event, relays: this.handler.relays})

    this.once(`auth-${id}`, auth_url => {
      window.open(auth_url, "Coracle", "width=600,height=800,popup=yes")
    })

    return new Promise(resolve => {
      this.once(`response-${id}`, ({result, error}) => {
        if (error) {
          logger.error(error)
          resolve(undefined)
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

    return this.request("create_account", [username, this.handler.domain, "", Perms], true)
  }

  async connect(token: string = null) {
    if (!this.#connectResult) {
      const params = [this.pubkey, token || "", Perms]

      this.#connectResult = await this.request("connect", params)
    }

    return this.#connectResult === "ack"
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
    this.#closed = true
    this.#sub?.close()
  }
}
