import {join} from "ramda"
import {nip44} from "nostr-tools"
import {cached} from "paravel"
import {switcherFn} from "hurdak"
import type {Session} from "src/engine/session/model"
import type {Connect} from "./connect"

// Deriving shared secret is an expensive computation, cache it
export const getSharedSecret = cached({
  maxSize: 100,
  getKey: join(":"),
  getValue: ([sk, pk]: string[]) => nip44.v2.utils.getConversationKey(sk, pk),
})

export class Nip44 {
  constructor(
    readonly session: Session,
    readonly connect: Connect,
  ) {}

  isEnabled() {
    return ["privkey", "connect"].includes(this.session?.method)
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
      connect: () => this.connect.broker.nip44Encrypt(pk, message),
    })
  }

  decryptAsUser(message: string, pk: string) {
    const {method, privkey} = this.session

    return switcherFn(method, {
      privkey: () => this.decrypt(message, pk, privkey),
      connect: () => this.connect.broker.nip44Decrypt(pk, message),
    })
  }
}
