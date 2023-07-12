import {nip04} from "nostr-tools"
import {switcherFn} from "hurdak/lib/hurdak"
import {tryJson, tryFunc, sleep} from "src/util/misc"

export function contributeActions({Keys}, emit) {
  async function encrypt(pubkey, message) {
    const {method, privkey} = Keys.current.get()

    return switcherFn(method, {
      extension: () => Keys.withExtension(ext => ext.nip04.encrypt(pubkey, message)),
      privkey: () => nip04.encrypt(privkey, pubkey, message),
      bunker: async () => {
        const ndk = await Keys.getNDK()
        const user = ndk.getUser({hexpubkey: pubkey})

        return ndk.signer.encrypt(user, message)
      },
    })
  }

  async function decrypt(pubkey, message) {
    const {method, privkey} = Keys.current.get()

    return switcherFn(method, {
      extension: () =>
        Keys.withExtension(ext => {
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
          tryFunc(() => nip04.decrypt(privkey, pubkey, message)) || `<Failed to decrypt message>`
        )
      },
      bunker: async () => {
        const ndk = await Keys.getNDK()
        const user = ndk.getUser({hexpubkey: pubkey})

        return ndk.signer.decrypt(user, message)
      },
    })
  }

  async function encryptJson(data) {
    const {pubkey} = Keys.current.get()

    return encrypt(pubkey, JSON.stringify(data))
  }

  async function decryptJson(data) {
    const {pubkey} = Keys.current.get()

    return tryJson(async () => JSON.parse(await decrypt(pubkey, data)))
  }

  return {encrypt, decrypt, encryptJson, decryptJson}
}
