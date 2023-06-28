import {nip19, nip04, getPublicKey, getEventHash, signEvent} from "nostr-tools"
import {derived} from "svelte/store"
import {error} from "src/util/logger"
import {synced, getter} from "src/util/misc"

const method = synced("system.keys/method")
const getMethod = getter(method)
const pubkey = synced("system.keys/pubkey")
const getPubkey = getter(pubkey)
const privkey = synced("system.keys/privkey")
const getPrivkey = getter(privkey)
const getExtension = () => (window as {nostr?: any}).nostr
const canSign = derived(method, $method => ["privkey", "extension"].includes($method))

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
  const $method = getMethod()

  event.pubkey = getPubkey()
  event.id = getEventHash(event)

  if ($method === "privkey") {
    return Object.assign(event, {
      sig: signEvent(event, getPrivkey()),
    })
  }

  if ($method === "extension") {
    return getExtension().signEvent(event)
  }

  throw new Error(`Unable to sign event, method is ${$method}`)
}

const getCrypt = () => {
  const $method = getMethod()

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
  canSign,
  validate,
  login,
  clear,
  sign,
  getCrypt,
  encryptJson,
  decryptJson,
}
