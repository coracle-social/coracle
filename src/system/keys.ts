import type {Writable, Readable} from "svelte/store"
import {prop} from "ramda"
import {nip19, nip04, getPublicKey, getSignature, generatePrivateKey} from "nostr-tools"
import {derived} from "svelte/store"
import NDK, {NDKEvent, NDKNip46Signer, NDKPrivateKeySigner} from "@nostr-dev-kit/ndk"
import {switcherFn} from "hurdak/lib/hurdak"
import {synced, tryJson, tryFunc, sleep, getter} from "src/util/misc"

const getExtension = () => (window as {nostr?: any}).nostr

export class Crypt {
  keys: Keys
  constructor(keys) {
    this.keys = keys
  }
  async encrypt(pubkey, message) {
    const {method, privkey} = this.keys.getState()

    return switcherFn(method, {
      extension: extension => getExtension().nip04.encrypt(pubkey, message),
      privkey: extension => nip04.encrypt(privkey, pubkey, message),
      bunker: async () => {
        const ndk = await this.keys.getNDK()
        const user = ndk.getUser({hexpubkey: pubkey})

        return ndk.signer.encrypt(user, message)
      },
    })
  }
  async decrypt(pubkey, message) {
    const {method, privkey} = this.keys.getState()

    return switcherFn(method, {
      extension: async () => {
        return new Promise(async resolve => {
          let result

          // Alby gives us a bunch of bogus errors, try multiple times
          for (let i = 0; i < 3; i++) {
            result = await tryFunc(() => getExtension().nip04.decrypt(pubkey, message))

            if (result) {
              break
            }

            await sleep(30)
          }

          resolve(result || `<Failed to decrypt message>`)
        })
      },
      privkey: () => {
        return (
          tryFunc(() => nip04.decrypt(privkey, pubkey, message)) || `<Failed to decrypt message>`
        )
      },
      bunker: async () => {
        const ndk = await this.keys.getNDK()
        const user = ndk.getUser({hexpubkey: pubkey})

        return ndk.signer.decrypt(user, message)
      },
    })
  }
  async encryptJson(data) {
    const {pubkey} = this.keys.getState()

    return this.encrypt(pubkey, JSON.stringify(data))
  }
  async decryptJson(data) {
    const {pubkey} = this.keys.getState()

    return tryJson(async () => await this.decrypt(pubkey, data))
  }
}

type KeyState = {
  method?: string
  pubkey?: string
  privkey?: string
  bunkerKey?: string
}

export default class Keys {
  keyState: Writable<KeyState>
  getState: () => KeyState
  pubkey: Readable<string>
  canSign: Readable<boolean>
  crypt: Crypt
  ndk: NDK
  constructor(ns) {
    this.keyState = synced(`${ns}/keys`, {})
    this.getState = getter(this.keyState)
    this.pubkey = derived(this.keyState, prop("pubkey"))
    this.canSign = derived(this.keyState, ({method}) =>
      ["bunker", "privkey", "extension"].includes(method)
    )
    this.crypt = new Crypt(this)
    this.ndk = null
  }
  isKeyValid(key) {
    // Validate the key before setting it to state by encoding it using bech32.
    // This will error if invalid (this works whether it's a public or a private key)
    try {
      nip19.npubEncode(key)
    } catch (e) {
      return false
    }

    return true
  }
  async prepareNdk(token?: string) {
    const {pubkey, bunkerKey} = this.getState()
    const localSigner = new NDKPrivateKeySigner(bunkerKey)

    this.ndk = new NDK({
      explicitRelayUrls: [
        "wss://relay.f7z.io",
        "wss://relay.damus.io",
        "wss://relay.nsecbunker.com",
      ],
    })

    this.ndk.signer = Object.assign(new NDKNip46Signer(this.ndk, pubkey, localSigner), {token})

    await this.ndk.connect(5000)
    await this.ndk.signer.blockUntilReady()
  }
  async getNDK() {
    if (!this.ndk) {
      await this.prepareNdk()
    }

    return this.ndk
  }
  login(method, key) {
    this.keyState.update($state => {
      let pubkey = null
      let privkey = null
      let bunkerKey = null

      if (method === "privkey") {
        privkey = key
        pubkey = getPublicKey(key)
      } else if (["pubkey", "extension"].includes(method)) {
        pubkey = key
      } else if (method === "bunker") {
        pubkey = key.pubkey
        bunkerKey = generatePrivateKey()

        this.prepareNdk(key.token)
      }

      return {method, pubkey, privkey, bunkerKey}
    })
  }
  clear() {
    this.keyState.set({})
  }
  async sign(event) {
    const {method, privkey} = this.getState()

    console.assert(event.id)
    console.assert(event.pubkey)
    console.assert(event.created_at)

    return switcherFn(method, {
      bunker: async () => {
        const ndkEvent = new NDKEvent(await this.getNDK(), event)

        await ndkEvent.sign(this.ndk.signer)

        return ndkEvent.rawEvent()
      },
      privkey: () => {
        return Object.assign(event, {
          sig: getSignature(event, privkey),
        })
      },
      extension: () => {
        return getExtension().signEvent(event)
      },
    })
  }
  getPubkey() {
    return this.getState().pubkey
  }
}
