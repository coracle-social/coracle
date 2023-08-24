import type {UnsignedEvent, Event} from "nostr-tools"
import {getPublicKey, getEventHash, getSignature} from "nostr-tools"
import type {Engine} from "src/engine/Engine"
import type {Nip44Opts} from "src/engine/components/Nip44"

export type Rumor = UnsignedEvent & {id: string}

export type WrapOpts = {
  recipientPk: string
  wrapperSk: string
  authorSk?: string
}

export const now = (drift = 0) =>
  Math.round(Date.now() / 1000 - Math.random() * Math.pow(10, drift))

export class Nip59 {
  engine: Engine

  createRumor = (event, sk?: string) => {
    if (event.sig) {
      throw new Error("Rumor must not have a signature")
    }

    const {Keys} = this.engine

    const rumor = {
      pubkey: sk ? getPublicKey(sk) : Keys.pubkey.get(),
      created_at: now(),
      content: "",
      tags: [],
      ...event,
    } as any

    rumor.id = getEventHash(rumor)

    return rumor as Rumor
  }

  async createSeal(rumor: Rumor, opts: Nip44Opts) {
    const {Nip44, Keys} = this.engine
    const content = await Nip44.encrypt(JSON.stringify(rumor), opts)
    const pubkey = opts.sk ? getPublicKey(opts.sk) : Keys.pubkey.get()

    const seal = {
      content,
      kind: 13,
      created_at: now(5),
      pubkey,
      tags: [],
    } as any

    seal.id = getEventHash(seal)
    seal.sig = opts.sk ? getSignature(seal, opts.sk) : Keys.sign(seal)

    return seal as Event
  }

  async createWrap(seal: Event, opts: Nip44Opts) {
    const {Nip44, Keys, Builder} = this.engine
    const content = await Nip44.encrypt(JSON.stringify(seal), opts)
    const pubkey = opts.sk ? getPublicKey(opts.sk) : Keys.pubkey.get()

    const wrap = {
      content,
      kind: 1059,
      created_at: now(5),
      tags: [Builder.mention(opts.pk)],
      pubkey,
    } as any

    wrap.id = getEventHash(wrap)
    wrap.sig = opts.sk ? getSignature(wrap, opts.sk) : await Keys.sign(wrap)

    return wrap as Event
  }

  async wrap(event, {recipientPk, wrapperSk, authorSk}: WrapOpts) {
    const rumor = this.createRumor(event, authorSk)
    const seal = await this.createSeal(rumor, {sk: authorSk, pk: recipientPk})
    const wrap = await this.createWrap(seal, {sk: wrapperSk, pk: recipientPk})

    return wrap
  }

  async unwrap(wrap: Event, recipientSk?: string) {
    const {Nip44} = this.engine

    // Skip trying to parse the old version
    if (wrap.content.includes("ciphertext")) {
      return null
    }

    const seal = await Nip44.decryptJson(wrap.content, {sk: recipientSk, pk: wrap.pubkey})
    const rumor = await Nip44.decryptJson(seal.content, {sk: recipientSk, pk: seal.pubkey})

    return {wrap, seal, rumor}
  }

  withUnwrappedEvent = async (e, privkey, cb) => {
    let wrap, seal, rumor

    try {
      ;({wrap, seal, rumor} = await this.unwrap(e, privkey))
    } catch (e) {
      console.warn(e)

      return
    }

    if (seal.pubkey === rumor.pubkey) {
      return cb({wrap, seal, rumor})
    }
  }

  initialize(engine: Engine) {
    this.engine = engine
  }
}
