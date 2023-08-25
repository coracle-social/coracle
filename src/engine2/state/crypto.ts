import {switcherFn} from "hurdak"
import type {KeyState} from "src/engine2/model"
import {derived} from "src/engine2/util/store"
import {encryptFor, decryptFor} from "src/engine2/util/nip44"

export class Crypto {
  constructor(readonly user: KeyState) {}

  encryptWithKey(event, pk: string, sk: string) {
    return encryptFor(sk, pk, JSON.stringify(event))
  }

  decryptWithKey(event, sk: string) {
    return JSON.parse(decryptFor(sk, event.pubkey, event.content))
  }

  encryptAsUser(event, pk: string) {
    const {method, privkey} = this.user

    return switcherFn(method, {
      privkey: () => this.encryptWithKey(event, pk, privkey),
    })
  }

  decryptAsUser(event) {
    const {method, privkey} = this.user

    return switcherFn(method, {
      privkey: () => this.decryptWithKey(event, privkey),
    })
  }
}

export const deriveCrypto = ({user}) => derived([user], ([$user]) => new Crypto($user))
