import {nip04} from "nostr-tools"
import {switcherFn, sleep, tryFunc} from "hurdak"
import {tryJson} from "src/util/misc"
import type {Engine} from "src/engine/Engine"
import type {KeyState} from "src/engine/types"

export class Crypt {
  engine: Engine

  async encrypt(pubkey: string, message: string) {
    const {method, privkey} = this.engine.components.Keys.current.get() as KeyState

    return switcherFn(method, {
      extension: () =>
        this.engine.components.Keys.withExtension((ext: any) => ext.nip04.encrypt(pubkey, message)),
      privkey: () => nip04.encrypt(privkey as string, pubkey, message),
      bunker: async () => {
        const ndk = await this.engine.components.Keys.getNDK()
        const user = ndk.getUser({hexpubkey: pubkey})

        return ndk.signer.encrypt(user, message)
      },
    })
  }

  async decrypt(pubkey: string, message: string) {
    const {method, privkey} = this.engine.components.Keys.current.get() as KeyState

    return switcherFn(method, {
      extension: () =>
        this.engine.components.Keys.withExtension((ext: any) => {
          return new Promise(async resolve => {
            let result

            // Alby gives us a bunch of bogus errors, try multiple times
            for (let i = 0; i < 3; i++) {
              result = await tryFunc(() => ext.nip04.decrypt(pubkey, message))

              if (result) {
                break
              }

              await sleep(30)
            }

            resolve(result || `<Failed to decrypt message>`)
          })
        }),
      privkey: () => {
        return (
          tryFunc(() => nip04.decrypt(privkey as string, pubkey, message)) ||
          `<Failed to decrypt message>`
        )
      },
      bunker: async () => {
        const ndk = await this.engine.components.Keys.getNDK()
        const user = ndk.getUser({hexpubkey: pubkey})

        return ndk.signer.decrypt(user, message)
      },
    })
  }

  async encryptJson(data: any) {
    const {pubkey} = this.engine.components.Keys.current.get() as KeyState

    return this.encrypt(pubkey, JSON.stringify(data))
  }

  async decryptJson(data: string) {
    const {pubkey} = this.engine.components.Keys.current.get() as KeyState

    return tryJson(async () => JSON.parse(await this.decrypt(pubkey, data)))
  }

  initialize(engine: Engine) {
    this.engine = engine
  }
}
