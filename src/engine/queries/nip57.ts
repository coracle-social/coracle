import {identity} from "ramda"
import {tryJson} from "src/util/misc"
import {getInvoiceAmount} from "src/util/lightning"
import {Tags} from "src/util/nostr"
import type {Event, ZapEvent} from "src/engine/model"
import {people} from "src/engine/state"

export const processZap = (event, zapper) => {
  if (!zapper) {
    return null
  }

  const zapMeta = Tags.from(event).asMeta() as {
    bolt11: string
    description: string
  }

  const zap = tryJson(() => ({
    ...event,
    invoiceAmount: getInvoiceAmount(zapMeta.bolt11),
    request: JSON.parse(zapMeta.description),
  })) as ZapEvent

  if (!zap) {
    return null
  }

  // Don't count zaps that the user sent himself
  if (zap.request.pubkey === zapper.pubkey) {
    return null
  }

  const {invoiceAmount, request} = zap
  const reqMeta = Tags.from(request).asMeta() as {
    amount?: string
    lnurl?: string
  }

  // Verify that the zapper actually sent the requested amount (if it was supplied)
  if (reqMeta.amount && parseInt(reqMeta.amount) !== invoiceAmount) {
    return null
  }

  // If the sending client provided an lnurl tag, verify that too
  if (reqMeta.lnurl && reqMeta.lnurl !== zapper.lnurl) {
    return null
  }

  // Verify that the zap note actually came from the recipient's zapper
  if (zapper.nostrPubkey !== zap.pubkey) {
    return null
  }

  return zap
}

export const processZaps = (zaps: Event[], pubkey: string) => {
  const {zapper} = people.key(pubkey).get() || {}

  if (!zapper) {
    return []
  }

  return zaps.map(e => processZap(e, zapper)).filter(identity)
}
