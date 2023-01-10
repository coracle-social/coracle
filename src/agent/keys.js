import {getPublicKey, getEventHash, signEvent} from 'nostr-tools'
import {get} from 'svelte/store'
import {synced} from 'src/util/misc'

let signingFunction

const pubkey = synced('agent/user/pubkey')
const privkey = synced('agent/user/privkey')

const setPrivateKey = _privkey => {
  privkey.set(_privkey)
  pubkey.set(getPublicKey(_privkey))
}

const setPublicKey = _pubkey => {
  signingFunction = async event => {
    const {sig} = await window.nostr.signEvent(event)

    return sig
  }

  pubkey.set(_pubkey)
}

const sign = async event => {
  event.pubkey = get(pubkey)
  event.id = getEventHash(event)
  event.sig = signingFunction
    ? await signingFunction(event)
    : signEvent(event, get(privkey))

  return event
}

const clear = () => {
  pubkey.set(null)
  privkey.set(null)
}


// Init signing function by re-setting pubkey
setPublicKey(get(pubkey))

export default {pubkey, setPrivateKey, setPublicKey, sign, clear}
