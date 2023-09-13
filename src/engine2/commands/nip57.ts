import {Fetch} from "hurdak"
import {warn} from "src/util/logger"
import {people} from "src/engine2/state"
import {signer, getPubkeyHints, getPublishHints} from "src/engine2/queries"
import {buildEvent} from "./util"

export async function requestZap(content, amount, {pubkey, event = null}) {
  const person = people.key(pubkey).get()

  if (!person?.zapper) {
    throw new Error("Can't zap a person without a zapper")
  }

  const {callback, lnurl} = person.zapper
  const msats = amount * 1000
  const relays = event ? getPublishHints(event) : getPubkeyHints(pubkey, "read")

  const tags = [
    ["relays", ...relays],
    ["amount", msats.toString()],
    ["lnurl", lnurl],
    ["p", pubkey],
  ]

  if (event) {
    tags.push(["e", event.id])
  }

  const zap = signer.get().prepAsUser(buildEvent(9734, {content, tags}))
  const zapString = encodeURI(JSON.stringify(zap))
  const res = await Fetch.fetchJson(
    `${callback}?amount=${amount}&nostr=${zapString}&lnurl=${lnurl}`
  )

  if (!res.pr) {
    warn(JSON.stringify(res))
  }

  return {relays, invoice: res?.pr}
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
