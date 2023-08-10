import type {UnsignedEvent, Event} from "nostr-tools"
import {getPublicKey, getEventHash, getSignature} from "nostr-tools"
import {xchacha20} from "@noble/ciphers/chacha"
import {secp256k1} from "@noble/curves/secp256k1"
import {sha256} from "@noble/hashes/sha256"
import {randomBytes} from "@noble/hashes/utils"
import {base64} from "@scure/base"

export const utf8Decoder = new TextDecoder()

export const utf8Encoder = new TextEncoder()

export const fromHex = hex => Uint8Array.from(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))

export const toHex = bytes =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, "0"), "")

export const now = (drift = 0) =>
  Math.round(Date.now() / 1000 - Math.random() * Math.pow(10, drift))

export const getConversationKey = (privkeyA: string, pubkeyB: string): Uint8Array =>
  sha256(secp256k1.getSharedSecret(privkeyA, "02" + pubkeyB).subarray(1, 33))

export const getNonce = () => base64.encode(randomBytes(24))

export type EncryptedPayload = {
  ciphertext: string
  nonce: string
  v: 1
}

export function encrypt(key: Uint8Array, text: string, v = 1): EncryptedPayload {
  if (v !== 1) throw new Error("NIP44: unknown encryption version")

  const nonce = randomBytes(24)
  const plaintext = utf8Encoder.encode(text)
  const ciphertext = xchacha20(key, nonce, plaintext)

  return {
    ciphertext: base64.encode(ciphertext),
    nonce: base64.encode(nonce),
    v,
  }
}

export function decrypt(key: Uint8Array, data: EncryptedPayload): string {
  if (data.v !== 1) throw new Error("NIP44: unknown encryption version")

  const nonce = base64.decode(data.nonce)
  const ciphertext = base64.decode(data.ciphertext)
  const plaintext = xchacha20(key, nonce, ciphertext)

  return utf8Decoder.decode(plaintext)
}

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
  const sealKey = getConversationKey(authorPrivkey, recipientPubkey)
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
  const conversationKey = getConversationKey(wrapperPrivkey, recipientPubkey)
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
  const sealKey = getConversationKey(recipientPrivkey, wrap.pubkey)
  const seal = JSON.parse(decrypt(sealKey, JSON.parse(wrap.content)))
  const rumorKey = getConversationKey(recipientPrivkey, seal.pubkey)
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
