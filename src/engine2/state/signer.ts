import {switcherFn} from "hurdak"
import type {UnsignedEvent} from "nostr-tools"
import {getSignature, getPublicKey, getEventHash} from "nostr-tools"
import type NDK from "@nostr-dev-kit/ndk"
import {NDKEvent} from "@nostr-dev-kit/ndk"
import {derived} from "src/engine2/util/store"
import {withExtension} from "src/engine2/util/nip07"
import type {Rumor, KeyState} from "src/engine2/model"

export class Signer {
  constructor(readonly user: KeyState | null, readonly ndk: NDK | null) {}

  prepWithKey(event: UnsignedEvent, sk: string) {
    event.pubkey = getPublicKey(sk)
    ;(event as Rumor).id = getEventHash(event)

    return event
  }

  prepAsUser(event: UnsignedEvent) {
    const {pubkey} = this.user

    event.pubkey = pubkey
    ;(event as Rumor).id = getEventHash(event)

    return event
  }

  signWithKey(event: UnsignedEvent, sk: string) {
    event = this.prepWithKey(event, sk)

    return {...event, sig: getSignature(event, sk)}
  }

  signAsUser(event: UnsignedEvent) {
    const {method, privkey} = this.user

    event = this.prepAsUser(event)

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

export const deriveSigner = ({user, ndk}) =>
  derived([user, ndk], ([$user, $ndk]) => new Signer($user, $ndk))
