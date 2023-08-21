import {propEq, defaultTo, find, reject} from "ramda"
import type {Event} from "nostr-tools"
import {nip19, getPublicKey, getSignature, generatePrivateKey} from "nostr-tools"
import NDK, {NDKEvent, NDKNip46Signer, NDKPrivateKeySigner} from "@nostr-dev-kit/ndk"
import {switcherFn} from "hurdak"
import {writable} from "src/engine/util/store"
import type {KeyState} from "src/engine/types"
import type {Engine} from "src/engine/Engine"

export class Keys {
  pubkey = writable<string | null>(null)
  keyState = writable<KeyState[]>([])

  stateKey = this.pubkey.derived(defaultTo("anonymous"))

  current = this.pubkey.derived(k => this.getKeyState(k))

  canSign = this.current.derived(keyState =>
    ["bunker", "privkey", "extension"].includes(keyState?.method)
  )

  canUseGiftWrap = this.current.derived(keyState => keyState?.method === "privkey")

  getKeyState = (k: string) => find(propEq("pubkey", k), this.keyState.get())

  setKeyState = (v: KeyState) =>
    this.keyState.update((s: KeyState[]) => reject(propEq("pubkey", v.pubkey), s).concat(v))

  removeKeyState = (k: string) =>
    this.keyState.update((s: KeyState[]) => reject(propEq("pubkey", k), s))

  withExtension = (() => {
    let extensionLock = Promise.resolve()

    const getExtension = () => (window as {nostr?: any}).nostr

    return (f: (ext: any) => void) => {
      extensionLock = extensionLock.catch(e => console.error(e)).then(() => f(getExtension()))

      return extensionLock
    }
  })()

  isKeyValid = (key: string) => {
    // Validate the key before setting it to state by encoding it using bech32.
    // This will error if invalid (this works whether it's a public or a private key)
    try {
      nip19.npubEncode(key)
    } catch (e) {
      return false
    }

    return true
  }

  getNDK = (() => {
    const ndkInstances = new Map()

    const prepareNDK = async (token?: string) => {
      const {pubkey, bunkerKey} = this.current.get() as KeyState
      const localSigner = new NDKPrivateKeySigner(bunkerKey)

      const ndk = new NDK({
        explicitRelayUrls: [
          "wss://relay.f7z.io",
          "wss://relay.damus.io",
          "wss://relay.nsecbunker.com",
        ],
      })

      ndk.signer = Object.assign(new NDKNip46Signer(ndk, pubkey, localSigner), {token})

      await ndk.connect(5000)
      await ndk.signer.blockUntilReady()

      ndkInstances.set(pubkey, ndk)
    }

    return async (token?: string) => {
      const {pubkey} = this.current.get() as KeyState

      if (!ndkInstances.has(pubkey)) {
        await prepareNDK(token)
      }

      return ndkInstances.get(pubkey)
    }
  })()

  login = (method: string, key: string | {pubkey: string; token: string}) => {
    let pubkey = null
    let privkey = null
    let bunkerKey = null

    if (method === "privkey") {
      privkey = key as string
      pubkey = getPublicKey(privkey)
    } else if (["pubkey", "extension"].includes(method)) {
      pubkey = key as string
    } else if (method === "bunker") {
      pubkey = (key as {pubkey: string}).pubkey
      bunkerKey = generatePrivateKey()

      this.getNDK((key as {token: string}).token)
    }

    this.setKeyState({method, pubkey, privkey, bunkerKey})
    this.pubkey.set(pubkey)
  }

  sign = async (event: Event) => {
    const {method, privkey} = this.current.get()

    console.assert(event.id)
    console.assert(event.pubkey)
    console.assert(event.created_at)

    return switcherFn(method, {
      bunker: async () => {
        const ndk = await this.getNDK()
        const ndkEvent = new NDKEvent(ndk, event)

        await ndkEvent.sign(ndk.signer)

        return ndkEvent.rawEvent()
      },
      privkey: () => {
        return Object.assign(event, {
          sig: getSignature(event, privkey),
        })
      },
      extension: () => this.withExtension(ext => ext.signEvent(event)),
    })
  }

  clear = () => {
    const $pubkey = this.pubkey.get()

    this.pubkey.set(null)

    if ($pubkey) {
      this.removeKeyState($pubkey)
    }
  }

  initialize(engine: Engine) {
    // pass
  }
}
