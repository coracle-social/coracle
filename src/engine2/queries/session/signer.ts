import {switcherFn} from "hurdak"
import type {EventTemplate, UnsignedEvent} from "nostr-tools"
import {getSignature, getPublicKey, getEventHash} from "nostr-tools"
import type NDK from "@nostr-dev-kit/ndk"
import {NDKEvent} from "@nostr-dev-kit/ndk"
import type {Rumor, Session} from "src/engine2/model"
import {withExtension} from "src/engine2/queries/nip07"

export class Signer {
  constructor(readonly session: Session | null, readonly ndk: NDK | null) {}

  prepWithKey(event: EventTemplate, sk: string) {
    ;(event as UnsignedEvent).pubkey = getPublicKey(sk)
    ;(event as Rumor).id = getEventHash(event as UnsignedEvent)

    return event as Rumor
  }

  prepAsUser(event: EventTemplate) {
    const {pubkey} = this.session

    ;(event as UnsignedEvent).pubkey = pubkey
    ;(event as Rumor).id = getEventHash(event as UnsignedEvent)

    return event as Rumor
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
      extension: async () => {
        return await withExtension(ext => ext.signEvent(event))
      },
      bunker: async () => {
        const ndkEvent = new NDKEvent(this.ndk, event)

        await ndkEvent.sign(this.ndk.signer)

        return ndkEvent.rawEvent()
      },
    })
  }
}
