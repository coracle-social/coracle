import {xchacha20} from "@noble/ciphers/chacha"
import {secp256k1} from "@noble/curves/secp256k1"
import {sha256} from "@noble/hashes/sha256"
import {randomBytes} from "@noble/hashes/utils"
import {base64} from "@scure/base"

export const utf8Decoder = new TextDecoder()

export const utf8Encoder = new TextEncoder()

export const getSharedSecret = (privkeyA: string, pubkeyB: string): Uint8Array =>
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
