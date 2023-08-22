import {switcherFn, tryFunc} from "hurdak"
import {tryJson} from "src/util/misc"
import {LRUCache} from "src/util/lruCache"
import type {Engine} from "src/engine/Engine"
import * as nip44 from "src/engine/util/nip44"

export type Nip44Opts = {
  pk?: string
  sk?: string
}

const sharedSecretCache = new LRUCache<string, Uint8Array>(100)

// Deriving shared secret is an expensive computation
function getSharedSecret(sk: string, pk: string) {
  const cacheKey = `${sk.slice(0, 8)}:${pk}`

  let result = sharedSecretCache.get(cacheKey)

  if (!result) {
    result = nip44.getSharedSecret(sk, pk)

    sharedSecretCache.set(cacheKey, result)
  }

  return result
}

export class Nip44 {
  engine: Engine

  async encrypt(message: string, {pk, sk}: Nip44Opts = {}) {
    if (!pk) {
      pk = this.engine.Keys.pubkey.get()
    }

    if (sk) {
      return nip44.encrypt(getSharedSecret(sk, pk), message)
    }

    return switcherFn(this.engine.Keys.method.get(), {
      privkey: () => {
        const privkey = this.engine.Keys.privkey.get() as string
        const secret = getSharedSecret(privkey, pk)

        return nip44.encrypt(secret, message)
      },
    })
  }

  async decrypt(message, {pk, sk}: Nip44Opts = {}) {
    if (!pk) {
      pk = this.engine.Keys.pubkey.get()
    }

    if (sk) {
      return nip44.decrypt(getSharedSecret(sk, pk), message)
    }

    return switcherFn(this.engine.Keys.method.get(), {
      privkey: () => {
        const privkey = this.engine.Keys.privkey.get() as string
        const secret = getSharedSecret(privkey, pk)

        return tryFunc(() => nip44.decrypt(secret, message)) || `<Failed to decrypt message>`
      },
    })
  }

  async encryptJson(data: any, opts?: Nip44Opts) {
    return this.encrypt(JSON.stringify(data), opts)
  }

  async decryptJson(data: string, opts?: Nip44Opts) {
    return tryJson(async () => JSON.parse(await this.decrypt(data, opts)))
  }

  initialize(engine: Engine) {
    this.engine = engine
  }
}
