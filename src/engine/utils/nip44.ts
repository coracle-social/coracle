import {join} from "ramda"
import {nip44} from "nostr-tools"
import {cached} from "@welshman/lib"
import {switcherFn, tryFunc} from "hurdak"
import type {Session} from "src/engine/model"
import type {Connect} from "./connect"
import {withExtension} from "./nip07"

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
    if (["privkey", "connect"].includes(this.session?.method)) {
      return true
    }

    if (this.session?.method === "extension") {
      return Boolean((window as any).nostr?.nip44)
    }

    return false
  }

  encrypt(message: string, pk: string, sk: string) {
    return nip44.v2.encrypt(message, getSharedSecret(sk, pk))
  }

  decrypt(payload: string, pk: string, sk: string) {
    return tryFunc(() => nip44.v2.decrypt(payload, getSharedSecret(sk, pk)))
  }

  encryptAsUser(message: string, pk: string) {
    const {method, privkey} = this.session

    return switcherFn(method, {
      privkey: () => this.encrypt(message, pk, privkey),
      extension: () => withExtension(ext => ext.nip44.encrypt(pk, message)),
      connect: () => this.connect.broker.nip44Encrypt(pk, message),
    })
  }

  decryptAsUser(message: string, pk: string) {
    const {method, privkey} = this.session

    return switcherFn(method, {
      privkey: () => this.decrypt(message, pk, privkey),
      extension: () => withExtension(ext => ext.nip44.decrypt(pk, message)),
      connect: () => this.connect.broker.nip44Decrypt(pk, message),
    })
  }
}
