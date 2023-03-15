import {nip19, nip04, getPublicKey, getEventHash, signEvent} from "nostr-tools"
import {get} from "svelte/store"
import {error} from "src/util/logger"
import {synced} from "src/util/misc"

const method = synced("agent/keys/method")
const pubkey = synced("agent/keys/pubkey")
const privkey = synced("agent/keys/privkey")
const getExtension = () => (window as {nostr?: any}).nostr
const canSign = () => ["privkey", "extension"].includes(get(method))

// Validate the key before setting it to state by encoding it using bech32.
// This will error if invalid (this works whether it's a public or a private key)
const validate = key => nip19.npubEncode(key)

const login = ($method, key) => {
  method.set($method)

  if ($method === "privkey") {
    privkey.set(key)
    pubkey.set(getPublicKey(key))
  } else {
    privkey.set(null)
    pubkey.set(key)
  }
}

const clear = () => {
  method.set(null)
  pubkey.set(null)
  privkey.set(null)
}

const sign = event => {
  const $method = get(method)

  event.pubkey = get(pubkey)
  event.id = getEventHash(event)

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

export default {
  method,
  pubkey,
  privkey,
  canSign,
  validate,
  login,
  clear,
  sign,
  getCrypt,
}
