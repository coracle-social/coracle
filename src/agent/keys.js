import {getPublicKey, getEventHash, signEvent} from 'nostr-tools'

let pubkey
let privkey
let signingFunction

const getPubkey = () => {
  return pubkey || getPublicKey(privkey)
}

const setPrivateKey = _privkey => {
  privkey = _privkey
}

const setPublicKey = _pubkey => {
  signingFunction = async event => {
    const {sig} = await window.nostr.signEvent(event)

    return sig
  }

  pubkey = _pubkey
}

const sign = async event => {
  event.pubkey = pubkey
  event.id = getEventHash(event)
  event.sig = signingFunction ? await signingFunction(event) : signEvent(event, privkey)

  return event
}

export default {getPubkey, setPrivateKey, setPublicKey, sign}
