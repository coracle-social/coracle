import type {UnsignedEvent, Event} from "nostr-tools"
import {getPublicKey, getEventHash, getSignature} from "nostr-tools"
import {getSharedSecret, encrypt, decrypt} from "./nip44"

export const now = (drift = 0) =>
  Math.round(Date.now() / 1000 - Math.random() * Math.pow(10, drift))

export const createRumor = event => {
  if (event.sig) {
    throw new Error("Rumor must not have a signature")
  }

  const rumor = {
    created_at: now(),
    content: "",
    tags: [],
    ...event,
  } as any

  rumor.id = getEventHash(rumor)

  return rumor as UnsignedEvent & {id: string}
}

export const createSeal = (authorPrivkey: string, recipientPubkey, rumor) => {
  const sealKey = getSharedSecret(authorPrivkey, recipientPubkey)
  const content = JSON.stringify(encrypt(sealKey, JSON.stringify(rumor)))

  const seal = {
    content,
    kind: 13,
    created_at: now(5),
    pubkey: getPublicKey(authorPrivkey),
    tags: [],
  } as any

  seal.id = getEventHash(seal)
  seal.sig = getSignature(seal, authorPrivkey)

  return seal as Event
}

export const createWrap = (wrapperPrivkey, recipientPubkey, seal, tags = []) => {
  const conversationKey = getSharedSecret(wrapperPrivkey, recipientPubkey)
  const content = JSON.stringify(encrypt(conversationKey, JSON.stringify(seal)))

  const wrap = {
    tags,
    content,
    kind: 1059,
    created_at: now(5),
    pubkey: getPublicKey(wrapperPrivkey),
  } as any

  wrap.id = getEventHash(wrap)
  wrap.sig = getSignature(wrap, wrapperPrivkey)

  return wrap as Event
}

export const wrap = (authorPrivkey, recipientPubkey, wrapperPrivkey, event, tags = []) => {
  const rumor = createRumor(event)
  const seal = createSeal(authorPrivkey, recipientPubkey, rumor)
  const wrap = createWrap(wrapperPrivkey, recipientPubkey, seal, tags)

  return wrap
}

export const unwrap = (recipientPrivkey, wrap) => {
  const sealKey = getSharedSecret(recipientPrivkey, wrap.pubkey)
  const seal = JSON.parse(decrypt(sealKey, JSON.parse(wrap.content)))
  const rumorKey = getSharedSecret(recipientPrivkey, seal.pubkey)
  const rumor = JSON.parse(decrypt(rumorKey, JSON.parse(seal.content)))

  return {wrap, seal, rumor}
}

export const withUnwrappedEvent = (privkey, e, cb) => {
  let wrap, seal, rumor

  try {
    ;({wrap, seal, rumor} = unwrap(privkey, e))
  } catch (e) {
    console.warn(e)

    return
  }

  cb({wrap, seal, rumor})
}
