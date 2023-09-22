import {nip04} from "nostr-tools"
import type NDK from "@nostr-dev-kit/ndk"
import {switcherFn, sleep, tryFunc} from "hurdak"
import type {Session} from "src/engine/session/model"
import {withExtension} from "./nip07"

export class Nip04 {
  constructor(readonly session: Session | null, readonly ndk: NDK | null) {}

  async encrypt(message: string, pk: string, sk: string) {
    return nip04.encrypt(sk, pk, message)
  }

  async decrypt(message: string, pk: string, sk: string) {
    return tryFunc(() => nip04.decrypt(sk, pk, message)) || `<Failed to decrypt message>`
  }

  async encryptAsUser(message: string, pk: string) {
    const {method, privkey} = this.session

    return switcherFn(method, {
      privkey: () => this.encrypt(message, pk, privkey),
      extension: () => withExtension(ext => ext.nip04.encrypt(pk, message)),
      bunker: async () => {
        const user = this.ndk.getUser({hexpubkey: pk})

        return this.ndk.signer.encrypt(user, message)
      },
    })
  }

  async decryptAsUser(message: string, pk: string) {
    const {method, privkey} = this.session

    return switcherFn(method, {
      privkey: () => this.decrypt(message, pk, privkey),
      extension: () =>
        withExtension((ext: any) => {
          return new Promise(async resolve => {
            let result

            // Alby gives us a bunch of bogus errors, try multiple times
            for (let i = 0; i < 3; i++) {
              result = await tryFunc(() => ext.nip04.decrypt(pk, message))

              if (result) {
                break
              }

              await sleep(30)
            }

            resolve(result || `<Failed to decrypt message>`)
          })
        }),
      bunker: async () => {
        const user = this.ndk.getUser({hexpubkey: pk})

        return this.ndk.signer.decrypt(user, message)
      },
    })
  }
}
