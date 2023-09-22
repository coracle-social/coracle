import type {UnsignedEvent} from "nostr-tools"
import {getPublicKey} from "nostr-tools"
import {tryJson} from "src/util/misc"
import type {Session} from "src/engine/session/model"
import type {Signer} from "./signer"
import type {Nip44} from "./nip44"

export const now = (drift = 0) =>
  Math.round(Date.now() / 1000 - Math.random() * Math.pow(10, drift))

export const seal = (content, pubkey) => ({
  kind: 13,
  created_at: now(5),
  tags: [],
  content,
  pubkey,
})

export const wrap = (content, pubkey, recipient) => ({
  kind: 1059,
  created_at: now(5),
  tags: [["p", recipient]],
  content,
  pubkey,
})

export type WrapperParams = {
  author?: string
  wrap?: {
    author: string
    recipient: string
  }
}

export class Nip59 {
  constructor(readonly session: Session, readonly nip44: Nip44, readonly signer: Signer) {}

  getAuthorPubkey(sk?: string) {
    return sk ? getPublicKey(sk) : this.session.pubkey
  }

  prep(event: UnsignedEvent, sk?: string) {
    return sk ? this.signer.prepWithKey(event, sk) : this.signer.prepAsUser(event)
  }

  sign(event: UnsignedEvent, sk?: string) {
    return sk ? this.signer.signWithKey(event, sk) : this.signer.signAsUser(event)
  }

  encrypt(event, pk: string, sk?: string) {
    const message = JSON.stringify(event)

    return sk ? this.nip44.encrypt(message, pk, sk) : this.nip44.encryptAsUser(message, pk)
  }

  decrypt(event, sk?: string) {
    const {pubkey, content} = event
    const message = sk
      ? this.nip44.decrypt(content, pubkey, sk)
      : this.nip44.decryptAsUser(content, pubkey)

    return tryJson(() => JSON.parse(message))
  }

  getSeal(rumor, {author, wrap: {recipient}}: WrapperParams) {
    const content = this.encrypt(rumor, recipient, author)
    const rawEvent = seal(content, rumor.pubkey)
    const signedEvent = this.sign(rawEvent, author)

    return signedEvent
  }

  getWrap(seal, {wrap: {author, recipient}}: WrapperParams) {
    const content = this.encrypt(seal, recipient, author)
    const rawEvent = wrap(content, this.getAuthorPubkey(author), recipient)
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
        const seal = await this.decrypt(wrap, sk)
        const rumor = await this.decrypt(seal, sk)

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
