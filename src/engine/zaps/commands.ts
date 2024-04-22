import {Fetch, sleep, switcherFn} from "hurdak"
import {createEvent} from "@welshman/util"
import {generatePrivateKey} from "src/util/nostr"
import {warn} from "src/util/logger"
import {signer} from "src/engine/session/derived"
import {getClientTags} from "src/engine/network/utils"
import {getLightningImplementation, getZapperForPubkey} from "./utils"

export const requestZap = async (
  content,
  amount,
  {pubkey, relays, eid = null, lnurl = null, anonymous = false},
) => {
  const zapper = await getZapperForPubkey(pubkey, lnurl)

  if (!zapper) {
    throw new Error("Can't zap without a zapper")
  }

  const msats = amount * 1000
  const tags = [
    ...getClientTags(),
    ["relays", ...relays],
    ["amount", msats.toString()],
    ["lnurl", zapper.lnurl],
    ["p", pubkey],
  ]

  if (eid) {
    tags.push(["e", eid])
  }

  if (anonymous) {
    tags.push(["anon"])
  }

  const template = createEvent(9734, {content, tags})
  const zap = anonymous
    ? await signer.get().signWithKey(template, generatePrivateKey())
    : await signer.get().signAsUser(template)
  const zapString = encodeURI(JSON.stringify(zap))
  const qs = `?amount=${msats}&nostr=${zapString}&lnurl=${zapper.lnurl}`
  const res = await Fetch.fetchJson(zapper.callback + qs)

  if (!res.pr) {
    warn(JSON.stringify(res))
  }

  return res?.pr
}

export async function collectInvoiceWithWebLn(invoice) {
  const {webln} = window as {webln?: any}

  if (webln) {
    await webln.enable()

    try {
      await webln.sendPayment(invoice)

      return true
    } catch (e) {
      warn(e)
    }
  }
}

export async function collectInvoiceWithBitcoinConnect(invoice) {
  const bc = await import("@getalby/bitcoin-connect")

  await sleep(300)

  if (bc.isConnected()) {
    bc.launchPaymentModal({invoice})
  }
}

export const collectInvoice = async invoice =>
  switcherFn(await getLightningImplementation(), {
    webln: () => collectInvoiceWithWebLn(invoice),
    bc: () => collectInvoiceWithBitcoinConnect(invoice),
  })
