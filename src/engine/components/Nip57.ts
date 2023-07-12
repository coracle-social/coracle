import {fetchJson, now, tryFunc, tryJson, hexToBech32, bech32ToHex} from "src/util/misc"
import {invoiceAmount} from "src/util/lightning"
import {Tags} from "src/util/nostr"
import type {Zapper} from "src/engine/types"
import {collection} from "../util/store"

const getLnUrl = address => {
  // Try to parse it as a lud06 LNURL
  if (address.startsWith("lnurl1")) {
    return tryFunc(() => bech32ToHex(address))
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
  static contributeState() {
    const zappers = collection<Zapper>()

    return {zappers}
  }

  static contributeActions({Nip57}) {
    const processZaps = (zaps, pubkey) => {
      const zapper = Nip57.zappers.getKey(pubkey)

      if (!zapper) {
        return []
      }

      return zaps
        .map(zap => {
          const zapMeta = Tags.from(zap).asMeta()

          return tryJson(() => ({
            ...zap,
            invoiceAmount: invoiceAmount(zapMeta.bolt11),
            request: JSON.parse(zapMeta.description),
          }))
        })
        .filter(zap => {
          if (!zap) {
            return false
          }

          // Don't count zaps that the user sent himself
          if (zap.request.pubkey === pubkey) {
            return false
          }

          const {invoiceAmount, request} = zap
          const reqMeta = Tags.from(request).asMeta()

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

    return {processZaps}
  }

  static initialize({Events, Nip57}) {
    Events.addHandler(0, e => {
      tryJson(async () => {
        const kind0 = JSON.parse(e.content)
        const zapper = Nip57.zappers.getKey(e.pubkey)
        const address = (kind0.lud16 || kind0.lud06 || "").toLowerCase()

        if (!address || e.created_at < zapper?.created_at) {
          return
        }

        const url = getLnUrl(address)

        if (!url) {
          return
        }

        const result = await tryFunc(() => fetchJson(url), true)

        if (!result?.allowsNostr || !result?.nostrPubkey) {
          return
        }

        Nip57.zappers.setKey(e.pubkey, {
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
