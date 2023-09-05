import {switcherFn} from "hurdak"
import type {KeyState} from "src/engine2/model"
import {encryptFor, decryptFor} from "src/engine2/util/nip44"

export class Nip44 {
  constructor(readonly user: KeyState) {}

  encrypt(message: string, pk: string, sk: string) {
    return encryptFor(sk, pk, message)
  }

  decrypt(message: string, pk: string, sk: string) {
    return decryptFor(sk, pk, message)
  }

  encryptAsUser(message: string, pk: string) {
    const {method, privkey} = this.user

    return switcherFn(method, {
      privkey: () => this.encrypt(message, pk, privkey),
    })
  }

  decryptAsUser(message: string, pk: string) {
    const {method, privkey} = this.user

    return switcherFn(method, {
      privkey: () => this.decrypt(message, pk, privkey),
    })
  }
}
