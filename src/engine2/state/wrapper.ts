import type {UnsignedEvent} from "nostr-tools"
import {getPublicKey} from "nostr-tools"
import {derived} from "src/engine2/util/store"
import type {Signer} from "src/engine2/state/signer"
import type {Crypto} from "src/engine2/state/crypto"
import type {KeyState} from "src/engine2/model"
import {getSeal, getWrap} from "src/engine2/util/nip59"

export type WrapperParams = {
  author?: string
  wrap?: {
    author: string
    recipient: string
  }
}

export class Wrapper {
  constructor(readonly user: KeyState, readonly crypto: Crypto, readonly signer: Signer) {}

  getAuthorPubkey(sk?: string) {
    return sk ? getPublicKey(sk) : this.user.pubkey
  }

  prep(event: UnsignedEvent, sk?: string) {
    return sk ? this.signer.prepWithKey(event, sk) : this.signer.prepAsUser(event)
  }

  sign(event: UnsignedEvent, sk?: string) {
    return sk ? this.signer.signWithKey(event, sk) : this.signer.signAsUser(event)
  }

  encrypt(event, pk: string, sk?: string) {
    return sk ? this.crypto.encryptWithKey(event, pk, sk) : this.crypto.encryptAsUser(event, pk)
  }

  decrypt(event, sk?: string) {
    return sk ? this.crypto.decryptWithKey(event, sk) : this.crypto.decryptAsUser(event)
  }

  getSeal(rumor, {author, wrap: {recipient}}: WrapperParams) {
    const content = this.encrypt(rumor, recipient, author)
    const rawEvent = getSeal(content, rumor.pubkey)
    const signedEvent = this.sign(rawEvent, author)

    return signedEvent
  }

  getWrap(seal, {wrap: {author, recipient}}: WrapperParams) {
    const content = this.encrypt(seal, recipient, author)
    const rawEvent = getWrap(content, this.getAuthorPubkey(author), recipient)
    const signedEvent = this.sign(rawEvent, author)

    return signedEvent
  }

  wrap(event, params: WrapperParams) {
    const rumor = this.prep(event, params.author)
    const seal = this.getSeal(rumor, params)
    const wrap = this.getWrap(seal, params)

    return wrap
  }

  async unwrap(wrap, sk) {
    // Skip trying to parse the old version
    if (!wrap.content.includes("ciphertext")) {
      try {
        const seal = await this.decrypt(wrap.content, sk)
        const rumor = await this.decrypt(seal.content, sk)

        if (seal.pubkey === rumor.pubkey) {
          return Object.assign(rumor, {wrap, seen_on: wrap.seen_on})
        }
      } catch (e) {
        console.warn(e)
      }
    }

    return null
  }

  async withUnwrappedEvent(wrap, sk, cb) {
    const rumor = await this.unwrap(wrap, sk)

    if (rumor) {
      cb(rumor)
    }
  }
}

export const deriveWrapper = ({user, crypto, signer}) =>
  derived(
    [user, crypto, signer],
    ([$user, $crypto, $signer]) => new Wrapper($user, $crypto, $signer)
  )
