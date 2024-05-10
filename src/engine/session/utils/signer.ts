import {switcherFn} from "hurdak"
import type {EventTemplate, UnsignedEvent} from "nostr-tools"
import {getEventHash} from "nostr-tools"
import type {TrustedEvent} from "@welshman/util"
import {getPublicKey, getSignature} from "src/util/nostr"
import type {Session} from "src/engine/session/model"
import type {Connect} from "./connect"
import {withExtension} from "./nip07"

export class Signer {
  constructor(
    readonly session: Session | null,
    readonly connect: Connect | null,
  ) {}

  isEnabled() {
    return ["connect", "privkey", "extension"].includes(this.session?.method)
  }

  prepWithKey(event: EventTemplate, sk: string) {
    // Copy the event since we're mutating it
    event = {...event}
    ;(event as UnsignedEvent).pubkey = getPublicKey(sk)
    ;(event as TrustedEvent).id = getEventHash(event as UnsignedEvent)

    return event as TrustedEvent
  }

  prepAsUser(event: EventTemplate) {
    const {pubkey} = this.session

    // Copy the event since we're mutating it
    event = {...event}
    ;(event as UnsignedEvent).pubkey = pubkey
    ;(event as TrustedEvent).id = getEventHash(event as UnsignedEvent)

    return event as TrustedEvent
  }

  signWithKey(template: EventTemplate, sk: string) {
    const event = this.prepWithKey(template, sk)

    return {...event, sig: getSignature(event, sk)}
  }

  signAsUser(template: EventTemplate) {
    const {method, privkey} = this.session
    const event = this.prepAsUser(template)

    return switcherFn(method, {
      privkey: () => ({...event, sig: getSignature(event, privkey)}),
      extension: () => withExtension(ext => ext.signEvent(event)),
      connect: () => this.connect.broker.signEvent(template),
    })
  }
}
