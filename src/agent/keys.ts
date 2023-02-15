import {prop} from 'ramda'
import {nip04, getPublicKey, getEventHash, signEvent} from 'nostr-tools'
import {get} from 'svelte/store'
import {error} from 'src/util/logger'
import {synced} from 'src/util/misc'

const pubkey = synced('agent/user/pubkey')
const privkey = synced('agent/user/privkey')
const getExtension = () => (window as {nostr?: any}).nostr
const canSign = () => Boolean(getExtension() || get(privkey))

const setPrivateKey = _privkey => {
  privkey.set(_privkey)
  pubkey.set(getPublicKey(_privkey))
}

const setPublicKey = _pubkey => {
  pubkey.set(_pubkey)
}

const clear = () => {
  pubkey.set(null)
  privkey.set(null)
}

const sign = async event => {
  const ext = getExtension()

  event.pubkey = get(pubkey)
  event.id = getEventHash(event)
  event.sig = ext
    ? prop('sig', await ext.signEvent(event))
    : signEvent(event, get(privkey))

  return event
}

const getCrypt = () => {
  const $privkey = get(privkey)
  const nostr = getExtension()

  if (!$privkey && !nostr) {
    throw new Error('No encryption method available.')
  }

  return {
    encrypt: (pubkey, message) => {
      return $privkey
        ? nip04.encrypt($privkey, pubkey, message)
        : nostr.nip04.encrypt(pubkey, message)
    },
    decrypt: async (pubkey, message) => {
      try {
        return $privkey
          ? nip04.decrypt($privkey, pubkey, message)
          : await nostr.nip04.decrypt(pubkey, message)
      } catch (e) {
        error(e)

        return `<Failed to decrypt message: ${e}>`
      }
    },
  }
}

export default {
  pubkey, privkey, canSign, setPrivateKey, setPublicKey, clear,
  sign, getCrypt,
}
