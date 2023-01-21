import {nip04} from 'nostr-tools'
import {getPublicKey, getEventHash, signEvent} from 'nostr-tools'
import {get} from 'svelte/store'
import {synced} from 'src/util/misc'

let signingFunction

const pubkey = synced('agent/user/pubkey')
const privkey = synced('agent/user/privkey')
const hasExtension = () => Boolean(window.nostr)
const canSign = () => Boolean(hasExtension() || get(privkey))

const setPrivateKey = _privkey => {
  privkey.set(_privkey)
  pubkey.set(getPublicKey(_privkey))
}

const setPublicKey = _pubkey => {
  if (window.nostr) {
    signingFunction = async event => {
      const {sig} = await window.nostr.signEvent(event)

      return sig
    }
  }

  pubkey.set(_pubkey)
}

const clear = () => {
  pubkey.set(null)
  privkey.set(null)
}

const sign = async event => {
  event.pubkey = get(pubkey)
  event.id = getEventHash(event)
  event.sig = signingFunction
    ? await signingFunction(event)
    : signEvent(event, get(privkey))

  return event
}

const getCrypt = () => {
  const $privkey = get(privkey)

  if (!$privkey && !hasExtension()) {
    throw new Error('No encryption method available.')
  }

  return {
    encrypt: (pubkey, message) => {
      return $privkey
        ? nip04.encrypt($privkey, pubkey, message)
        : window.nostr.nip04.encrypt(pubkey, message)
    },
    decrypt: async (pubkey, message) => {
      try {
        return $privkey
          ? nip04.decrypt($privkey, pubkey, message)
          : await window.nostr.nip04.decrypt(pubkey, message)
      } catch (e) {
        console.error(e)
        return `<Failed to decrypt message: ${e}>`
      }
    },
  }
}

// Init signing function by re-setting pubkey
setPublicKey(get(pubkey))

export default {
  pubkey, privkey, hasExtension, canSign, setPrivateKey, setPublicKey, clear,
  sign, getCrypt,
}
