import {nip19, nip04, getPublicKey, getEventHash, signEvent, generatePrivateKey} from "nostr-tools"
import NDK, {NDKEvent, NDKNip46Signer, NDKPrivateKeySigner} from "@nostr-dev-kit/ndk"
import {get} from "svelte/store"
import {error} from "src/util/logger"
import {synced} from "src/util/misc"

const method = synced("agent/keys/method")
const pubkey = synced("agent/keys/pubkey")
const privkey = synced("agent/keys/privkey")
const bunkerKey = synced("agent/keys/bunkerKey")
const getExtension = () => (window as {nostr?: any}).nostr
const canSign = () => ["bunker", "privkey", "extension"].includes(get(method))

// Validate the key before setting it to state by encoding it using bech32.
// This will error if invalid (this works whether it's a public or a private key)
const validate = key => nip19.npubEncode(key)

let ndk, remoteSigner

const prepareNdk = async (token?: string) => {
  const localSigner = new NDKPrivateKeySigner(get(bunkerKey))

  ndk = new NDK({
    explicitRelayUrls: ["wss://relay.f7z.io", "wss://relay.damus.io", "wss://relay.nsecbunker.com"],
  })

  remoteSigner = new NDKNip46Signer(ndk, get(pubkey), localSigner)
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
  const $method = get(method)

  event.pubkey = get(pubkey)
  event.id = getEventHash(event)

  if ($method === "bunker") {
    const ndkEvent = new NDKEvent(await getNDK(), event)

    await ndkEvent.sign(remoteSigner)

    return ndkEvent.rawEvent()
  }

  if ($method === "privkey") {
    return Object.assign(event, {
      sig: signEvent(event, get(privkey)),
    })
  }

  if ($method === "extension") {
    return getExtension().signEvent(event)
  }

  throw new Error(`Unable to sign event, method is ${$method}`)
}

const getCrypt = () => {
  const $method = get(method)

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
    const $privkey = get(privkey)

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

const encryptJson = data => getCrypt().encrypt(get(pubkey), JSON.stringify(data))

const decryptJson = async data => {
  try {
    return JSON.parse(await getCrypt().decrypt(get(pubkey), data))
  } catch (e) {
    console.warn(e)

    return null
  }
}

export default {
  method,
  pubkey,
  privkey,
  bunkerKey,
  canSign,
  validate,
  login,
  clear,
  sign,
  getCrypt,
  encryptJson,
  decryptJson,
}
