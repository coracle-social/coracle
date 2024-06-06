import type {UnsignedEvent} from "nostr-tools"
import {WRAP} from '@welshman/util'
import {getPublicKey} from "src/util/nostr"
import {tryJson} from "src/util/misc"
import logger from "src/util/logger"
import type {Session} from "src/engine/model"
import type {Signer} from "./signer"
import type {Nip04} from "./nip04"
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

export const wrap = (content, pubkey, recipient, kind = WRAP, tags = []) => ({
  kind,
  created_at: now(5),
  tags: tags.concat([["p", recipient]]),
  content,
  pubkey,
})

export type WrapperParams = {
  author?: string
  wrap?: {
    author: string
    recipient: string
    kind?: 1059 | 1060
    algo?: "nip04" | "nip44"
    tags?: string[][]
  }
}

const seen = new Map()

export class Nip59 {
  constructor(
    readonly session: Session,
    readonly nip04: Nip04,
    readonly nip44: Nip44,
    readonly signer: Signer,
  ) {}

  getAuthorPubkey(sk?: string) {
    return sk ? getPublicKey(sk) : this.session.pubkey
  }

  prep(event: UnsignedEvent, sk?: string) {
    return sk ? this.signer.prepWithKey(event, sk) : this.signer.prepAsUser(event)
  }

  sign(event: UnsignedEvent, sk?: string) {
    return sk ? this.signer.signWithKey(event, sk) : this.signer.signAsUser(event)
  }

  async encrypt(event, pk: string, sk?: string, algo = "nip44") {
    const message = JSON.stringify(event)

    let payload

    // Temporarily support nip04
    if (algo === "nip04" && sk) {
      payload = await this.nip04.encrypt(message, pk, sk)
    } else if (algo === "nip04") {
      payload = await this.nip04.encryptAsUser(message, pk)
    } else if (sk) {
      payload = this.nip44.encrypt(message, pk, sk)
    } else {
      payload = this.nip44.encryptAsUser(message, pk)
    }

    return payload
  }

  async decrypt(event, sk?: string) {
    const {pubkey, content} = event

    let message

    if (sk) {
      // Temporarily support nip04
      if (this.nip04.isEnabled() && content.includes("?iv=")) {
        message = await this.nip04.decrypt(content, pubkey, sk)
      }

      if (!message && this.nip44.isEnabled()) {
        message = await this.nip44.decrypt(content, pubkey, sk)
      }
    } else {
      // Temporarily support nip04
      if (this.nip04.isEnabled() && content.includes("?iv=")) {
        message = await this.nip04.decryptAsUser(content, pubkey)
      }

      if (!message && this.nip44.isEnabled()) {
        message = await this.nip44.decryptAsUser(content, pubkey)
      }
    }

    return tryJson(() => JSON.parse(message))
  }

  async getSeal(rumor, {author, wrap: {recipient, algo}}: WrapperParams) {
    const content = await this.encrypt(rumor, recipient, author, algo)
    const rawEvent = seal(content, rumor.pubkey)
    const signedEvent = this.sign(rawEvent, author)

    return signedEvent
  }

  async getWrap(seal, {wrap: {author, recipient, algo, kind, tags = []}}: WrapperParams) {
    const content = await this.encrypt(seal, recipient, author, algo)
    const rawEvent = wrap(content, this.getAuthorPubkey(author), recipient, kind, tags)
    const signedEvent = this.sign(rawEvent, author)

    return signedEvent
  }

  async wrap(event, params: WrapperParams) {
    const rumor = this.prep(event, params.author)
    const seal = await this.getSeal(rumor, params)
    const wrap = await this.getWrap(seal, params)

    return Object.assign(rumor, {wrap})
  }

  async unwrap(wrap, sk) {
    // Avoid decrypting the same event multiple times
    if (seen.has(wrap.id)) {
      return seen.get(wrap.id)
    }

    try {
      const seal = await this.decrypt(wrap, sk)

      if (!seal) throw new Error("Failed to decrypt wrapper")

      const rumor = await this.decrypt(seal, sk)

      if (!rumor) throw new Error("Failed to decrypt seal")

      if (seal.pubkey === rumor.pubkey) {
        Object.assign(rumor, {wrap})
        seen.set(wrap.id, rumor)

        return rumor
      }
    } catch (e) {
      if (!e.toString().match(/version 1|Invalid nip44|Malformed/)) {
        logger.warn(e)
      }
    }
  }
}
