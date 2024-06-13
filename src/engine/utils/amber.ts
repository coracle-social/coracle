import {defer} from "hurdak"
import {sleep, tryCatch, Worker} from "@welshman/lib"
import type {HashedEvent, SignedEvent} from "@welshman/util"
import {hasValidSignature} from "@welshman/util"
import {parsePubkey} from "src/util/nostr"

const createGetPublicKeyIntent = () =>
  `intent:#Intent;scheme=nostrsigner;S.compressionType=none;S.returnType=signature;S.type=get_public_key;end`

const createSignEventIntent = (draft: HashedEvent) =>
  `intent:${encodeURIComponent(
    JSON.stringify(draft),
  )}#Intent;scheme=nostrsigner;S.compressionType=none;S.returnType=signature;S.type=sign_event;end`

const createNip04EncryptIntent = (pubkey: string, plainText: string) =>
  `intent:${encodeURIComponent(
    plainText,
  )}#Intent;scheme=nostrsigner;S.pubKey=${pubkey};S.compressionType=none;S.returnType=signature;S.type=nip04_encrypt;end`

const createNip04DecryptIntent = (pubkey: string, data: string) =>
  `intent:${encodeURIComponent(
    data,
  )}#Intent;scheme=nostrsigner;S.pubKey=${pubkey};S.compressionType=none;S.returnType=signature;S.type=nip04_decrypt;end`

const createNip44EncryptIntent = (pubkey: string, plainText: string) =>
  `intent:${encodeURIComponent(
    plainText,
  )}#Intent;scheme=nostrsigner;S.pubKey=${pubkey};S.compressionType=none;S.returnType=signature;S.type=nip44_encrypt;end`

const createNip44DecryptIntent = (pubkey: string, data: string) =>
  `intent:${encodeURIComponent(
    data,
  )}#Intent;scheme=nostrsigner;S.pubKey=${pubkey};S.compressionType=none;S.returnType=signature;S.type=nip44_decrypt;end`

class Request {
  result = defer<{result?: string; error?: string}>()

  constructor(readonly intent: string) {}

  fulfill = async () => {
    // Clear out the clipboard if we can
    await tryCatch(() => navigator.clipboard.writeText(""))

    // Send the intent to amber
    const other = window.open(this.intent, "_blank")

    // Wait a moment to avoid the visibilitychange listener firing before navigation
    await sleep(500)

    const cleanup = () => {
      document.removeEventListener("visibilitychange", onVisibilityChange)

      clearTimeout(timeout)
      other.close()
    }

    const onResult = result => {
      this.result.resolve({result})

      cleanup()
    }

    const onError = error => {
      this.result.resolve({error})

      cleanup()
    }

    const timeout = setTimeout(() => onError("No data received."), 15000)

    const onVisibilityChange = async () => {
      await sleep(500)

      if (document.visibilityState !== "visible") return

      try {
        const result = await navigator.clipboard.readText()

        if (result) {
          onResult(result)
        }
      } catch (e) {
        // Pass, document isn't focused
      }
    }

    document.addEventListener("visibilitychange", onVisibilityChange)

    return this.result
  }
}

let singleton: Amber

export class Amber {
  worker = new Worker<Request>()

  constructor() {
    this.worker.addGlobalHandler(request => request.fulfill())
  }

  static get() {
    if (!singleton) {
      singleton = new Amber()
    }

    return singleton
  }

  _request = async (intent: string) => {
    const request = new Request(intent)

    this.worker.push(request)

    return request.result.then(({result, error}) => {
      if (error) {
        throw error
      }

      return result
    })
  }

  isEnabled = () => navigator.userAgent.includes("Android") && navigator.clipboard?.readText

  getPubkey = async () => {
    const result = await this._request(createGetPublicKeyIntent())
    const pubkey = await parsePubkey(result)

    if (!pubkey) {
      throw new Error("Expected clipboard to have pubkey")
    }

    return pubkey
  }

  signEvent = async (draft: HashedEvent): Promise<SignedEvent> => {
    const sig = await this._request(createSignEventIntent(draft))

    if (!sig.match(/^[a-f0-9]+$/)) throw new Error("Expected hex signature")

    const event: SignedEvent = {...draft, sig}

    if (!hasValidSignature(event)) throw new Error("Invalid signature")

    return event
  }

  nip04Encrypt = (pubkey: string, plaintext: string): Promise<string> =>
    this._request(createNip04EncryptIntent(pubkey, plaintext))

  nip04Decrypt = (pubkey: string, data: string): Promise<string> =>
    this._request(createNip04DecryptIntent(pubkey, data))

  nip44Encrypt = (pubkey: string, plaintext: string): Promise<string> =>
    this._request(createNip44EncryptIntent(pubkey, plaintext))

  nip44Decrypt = (pubkey: string, data: string): Promise<string> =>
    this._request(createNip44DecryptIntent(pubkey, data))
}
