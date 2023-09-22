import {identity} from "ramda"
import {tryFunc} from "hurdak"
import {tryJson, bech32ToHex} from "src/util/misc"
import {Tags} from "src/util/nostr"
import {people} from "src/engine/people/state"
import type {Event} from "src/engine/events/model"
import type {ZapEvent} from "./model"

const DIVISORS = {
  m: BigInt(1e3),
  u: BigInt(1e6),
  n: BigInt(1e9),
  p: BigInt(1e12),
}

const MAX_MILLISATS = BigInt("2100000000000000000")

const MILLISATS_PER_BTC = BigInt(1e11)

export const hrpToMillisat = (hrpString: string) => {
  let divisor, value
  if (hrpString.slice(-1).match(/^[munp]$/)) {
    divisor = hrpString.slice(-1)
    value = hrpString.slice(0, -1)
  } else if (hrpString.slice(-1).match(/^[^munp0-9]$/)) {
    throw new Error("Not a valid multiplier for the amount")
  } else {
    value = hrpString
  }

  if (!value.match(/^\d+$/)) throw new Error("Not a valid human readable amount")

  const valueBN = BigInt(value)

  const millisatoshisBN = divisor
    ? (valueBN * MILLISATS_PER_BTC) / (DIVISORS as any)[divisor]
    : valueBN * MILLISATS_PER_BTC

  if (
    (divisor === "p" && !(valueBN % BigInt(10) === BigInt(0))) ||
    millisatoshisBN > MAX_MILLISATS
  ) {
    throw new Error("Amount is outside of valid range")
  }

  return millisatoshisBN
}

export const getInvoiceAmount = (bolt11: string) => {
  const hrp = bolt11.match(/lnbc(\d+\w)/)
  const bn = hrpToMillisat(hrp[1])
  return Number(bn)
}

export const getLnUrl = (address: string) => {
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
