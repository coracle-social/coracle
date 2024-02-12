import {nip04} from "nostr-tools"
import {switcherFn, tryFunc} from "hurdak"
import type {Session} from "src/engine/session/model"
import type {Connect} from "./connect"
import {withExtension} from "./nip07"

export class Nip04 {
  constructor(
    readonly session: Session,
    readonly connect: Connect,
  ) {}

  isEnabled() {
    return ["privkey", "connect", "extension"].includes(this.session?.method)
  }

  async encrypt(message: string, pk: string, sk: string) {
    return nip04.encrypt(sk, pk, message)
  }

  async decrypt(message: string, pk: string, sk: string) {
    return tryFunc(() => nip04.decrypt(sk, pk, message))
  }

  async encryptAsUser(message: string, pk: string) {
    const {method, privkey} = this.session

    return switcherFn(method, {
      privkey: () => this.encrypt(message, pk, privkey),
      extension: () => withExtension(ext => ext.nip04.encrypt(pk, message)),
      connect: () => this.connect.broker.nip04Encrypt(pk, message),
    })
  }

  async decryptAsUser(message: string, pk: string) {
    const {method, privkey} = this.session

    return switcherFn(method, {
      privkey: () => this.decrypt(message, pk, privkey),
      extension: () => withExtension(ext => ext.nip04.decrypt(pk, message)),
      connect: () => this.connect.broker.nip04Decrypt(pk, message),
    })
  }
}
