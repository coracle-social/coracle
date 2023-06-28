import {
  nip19,
  nip04,
  getPublicKey,
  getEventHash,
  getSignature,
  generatePrivateKey,
} from "nostr-tools"
import {derived} from "svelte/store"
import NDK, {NDKEvent, NDKNip46Signer, NDKPrivateKeySigner} from "@nostr-dev-kit/ndk"
import {error} from "src/util/logger"
import {synced, getter} from "src/util/misc"

const method = synced("system.keys/method")
const getMethod = getter(method)
const pubkey = synced("system.keys/pubkey")
const getPubkey = getter(pubkey)
const privkey = synced("system.keys/privkey")
const getPrivkey = getter(privkey)
const bunkerKey = synced("system.keys/bunkerKey")
const getBunkerKey = getter(bunkerKey)
const getExtension = () => (window as {nostr?: any}).nostr
const canSign = derived(method, $method => ["bunker", "privkey", "extension"].includes($method))

// Validate the key before setting it to state by encoding it using bech32.
// This will error if invalid (this works whether it's a public or a private key)
const validate = key => nip19.npubEncode(key)

let ndk, remoteSigner

const prepareNdk = async (token?: string) => {
  const localSigner = new NDKPrivateKeySigner(getBunkerKey())

  ndk = new NDK({
    explicitRelayUrls: ["wss://relay.f7z.io", "wss://relay.damus.io", "wss://relay.nsecbunker.com"],
  })

  remoteSigner = new NDKNip46Signer(ndk, getPubkey(), localSigner)
  remoteSigner.token = token

  ndk.signer = remoteSigner

  await ndk.connect(5000)
  await remoteSigner.blockUntilReady()
}

const getNDK = async () => {
  if (!ndk) {
    await prepareNdk()
  }

  return ndk
}

const login = ($method, key) => {
  method.set($method)

  pubkey.set(null)
  privkey.set(null)
  bunkerKey.set(null)

  if ($method === "privkey") {
    privkey.set(key)
    pubkey.set(getPublicKey(key))
  } else if (["pubkey", "extension"].includes($method)) {
    pubkey.set(key)
  } else if ($method === "bunker") {
    pubkey.set(key.pubkey)
    bunkerKey.set(generatePrivateKey())
    prepareNdk(key.token)
  }
}

const clear = () => {
  method.set(null)
  pubkey.set(null)
  privkey.set(null)
}

const sign = async event => {
  const $method = getMethod()

  event.pubkey = getPubkey()
  event.id = getEventHash(event)

  if ($method === "bunker") {
    const ndkEvent = new NDKEvent(await getNDK(), event)

    await ndkEvent.sign(remoteSigner)

    return ndkEvent.rawEvent()
  }

  if ($method === "privkey") {
    return Object.assign(event, {
      sig: getSignature(event, getPrivkey()),
    })
  }

  if ($method === "extension") {
    return getExtension().signEvent(event)
  }

  throw new Error(`Unable to sign event, method is ${$method}`)
}

const getCrypt = () => {
  const $method = getMethod()

  if ($method === "bunker") {
    return {
      encrypt: async (pubkey, message) => {
        const ndk = await getNDK()
        const user = ndk.getUser({hexpubkey: pubkey})

        return ndk.signer.encrypt(user, message)
      },
      decrypt: async (pubkey, message) => {
        const ndk = await getNDK()
        const user = ndk.getUser({hexpubkey: pubkey})

        return ndk.signer.decrypt(user, message)
      },
    }
  }

  if ($method === "privkey") {
    const $privkey = getPrivkey()

    return {
      encrypt: (pubkey, message) => nip04.encrypt($privkey, pubkey, message),
      decrypt: async (pubkey, message) => {
        try {
          return nip04.decrypt($privkey, pubkey, message)
        } catch (e) {
          error(e)

          return `<Failed to decrypt message: ${e}>`
        }
      },
    }
  }

  if ($method === "extension") {
    return {
      encrypt: (pubkey, message) => getExtension().nip04.encrypt(pubkey, message),
      decrypt: async (pubkey, message) => {
        try {
          return await getExtension().nip04.decrypt(pubkey, message)
        } catch (e) {
          error(e)

          return `<Failed to decrypt message: ${e}>`
        }
      },
    }
  }

  throw new Error("No encryption method available.")
}

const encryptJson = data => getCrypt().encrypt(getPubkey(), JSON.stringify(data))

const decryptJson = async data => {
  try {
    return JSON.parse(await getCrypt().decrypt(getPubkey(), data))
  } catch (e) {
    console.warn(e)

    return null
  }
}

export default {
  method,
  getMethod,
  pubkey,
  getPubkey,
  privkey,
  getPrivkey,
  bunkerKey,
  getBunkerKey,
  canSign,
  validate,
  login,
  clear,
  sign,
  getCrypt,
  encryptJson,
  decryptJson,
}
