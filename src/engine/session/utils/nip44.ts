import {join} from "ramda"
import {nip44} from "nostr-tools"
import {cached} from "paravel"
import {switcher, switcherFn} from "hurdak"
import type {Session} from "src/engine/session/model"

// Deriving shared secret is an expensive computation, cache it
export const getSharedSecret = cached({
  maxSize: 100,
  getKey: join(":"),
  getValue: ([sk, pk]: string[]) => nip44.v2.utils.getConversationKey(sk, pk),
})

export class Nip44 {
  constructor(readonly session: Session) {}

  isEnabled() {
    return switcher(this.session?.method, {
      privkey: true,
      default: false,
    })
  }

  encrypt(message: string, pk: string, sk: string) {
    return nip44.v2.encrypt(message, getSharedSecret(sk, pk))
  }

  decrypt(payload: string, pk: string, sk: string) {
    return nip44.v2.decrypt(payload, getSharedSecret(sk, pk))
  }

  encryptAsUser(message: string, pk: string) {
    const {method, privkey} = this.session

    return switcherFn(method, {
      privkey: () => this.encrypt(message, pk, privkey),
    })
  }

  decryptAsUser(message: string, pk: string) {
    const {method, privkey} = this.session

    return switcherFn(method, {
      privkey: () => this.decrypt(message, pk, privkey),
    })
  }
}
