import {Fetch, tryFunc} from "hurdak"
import {now, tryJson, hexToBech32, bech32ToHex} from "src/util/misc"
import {invoiceAmount} from "src/util/lightning"
import {Tags} from "src/util/nostr"
import type {Engine} from "src/engine/Engine"
import type {Zapper, ZapEvent, Event} from "src/engine/types"
import {collection} from "src/engine/util/store"

const getLnUrl = (address: string): string => {
  // Try to parse it as a lud06 LNURL
  if (address.startsWith("lnurl1")) {
    return tryFunc(() => bech32ToHex(address)) as string
  }

  // Try to parse it as a lud16 address
  if (address.includes("@")) {
    const [name, domain] = address.split("@")

    if (domain && name) {
      return `https://${domain}/.well-known/lnurlp/${name}`
    }
  }
}

export class Nip57 {
  zappers = collection<Zapper>("pubkey")

  processZaps = (zaps: Event[], pubkey: string) => {
    const zapper = this.zappers.key(pubkey).get()

    if (!zapper) {
      return []
    }

    return zaps
      .map((zap: Event) => {
        const zapMeta = Tags.from(zap).asMeta() as {
          bolt11: string
          description: string
        }

        return tryJson(() => ({
          ...zap,
          invoiceAmount: invoiceAmount(zapMeta.bolt11),
          request: JSON.parse(zapMeta.description),
        })) as ZapEvent
      })
      .filter((zap: ZapEvent) => {
        if (!zap) {
          return false
        }

        // Don't count zaps that the user sent himself
        if (zap.request.pubkey === pubkey) {
          return false
        }

        const {invoiceAmount, request} = zap
        const reqMeta = Tags.from(request).asMeta() as {
          amount?: string
          lnurl?: string
        }

        // Verify that the zapper actually sent the requested amount (if it was supplied)
        if (reqMeta.amount && parseInt(reqMeta.amount) !== invoiceAmount) {
          return false
        }

        // If the sending client provided an lnurl tag, verify that too
        if (reqMeta.lnurl && reqMeta.lnurl !== zapper.lnurl) {
          return false
        }

        // Verify that the zap note actually came from the recipient's zapper
        if (zapper.nostrPubkey !== zap.pubkey) {
          return false
        }

        return true
      })
  }

  initialize(engine: Engine) {
    engine.Events.addHandler(0, (e: Event) => {
      tryJson(async () => {
        const kind0 = JSON.parse(e.content)
        const zapper = this.zappers.key(e.pubkey)
        const address = (kind0.lud16 || kind0.lud06 || "").toLowerCase()

        if (!address || e.created_at < zapper.get()?.created_at) {
          return
        }

        const url = getLnUrl(address)

        if (!url) {
          return
        }

        const result = (await tryFunc(() => Fetch.fetchJson(url))) as any

        if (!result?.allowsNostr || !result?.nostrPubkey) {
          return
        }

        zapper.set({
          pubkey: e.pubkey,
          lnurl: hexToBech32("lnurl", url),
          callback: result.callback,
          minSendable: result.minSendable,
          maxSendable: result.maxSendable,
          nostrPubkey: result.nostrPubkey,
          created_at: e.created_at,
          updated_at: now(),
        })
      })
    })
  }
}
