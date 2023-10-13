import {Fetch} from "hurdak"
import {warn} from "src/util/logger"
import {buildEvent} from "src/engine/network/utils"
import {signer} from "src/engine/session/derived"
import {getZapperForPubkey} from "./utils"

export const requestZap = async (content, amount, {pubkey, relays, eid = null, lnurl = null}) => {
  const zapper = await getZapperForPubkey(pubkey, lnurl)

  if (!zapper) {
    throw new Error("Can't zap without a zapper")
  }

  const msats = amount * 1000
  const tags = [
    ["relays", ...relays],
    ["amount", msats.toString()],
    ["lnurl", zapper.lnurl],
    ["p", pubkey],
  ]

  if (eid) {
    tags.push(["e", eid])
  }

  const zap = await signer.get().signAsUser(buildEvent(9734, {content, tags}))
  const zapString = encodeURI(JSON.stringify(zap))
  const qs = `?amount=${msats}&nostr=${zapString}&lnurl=${zapper.lnurl}`
  const res = await Fetch.fetchJson(zapper.callback + qs)

  if (!res.pr) {
    warn(JSON.stringify(res))
  }

  return res?.pr
}

export async function collectInvoice(invoice) {
  const {webln} = window as {webln?: any}

  if (webln) {
    await webln.enable()

    try {
      webln.sendPayment(invoice)
    } catch (e) {
      warn(e)
    }
  }
}
