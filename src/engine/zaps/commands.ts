import {Fetch} from "hurdak"
import {warn} from "src/util/logger"
import {people} from "src/engine/people/state"
import {buildEvent} from "src/engine/network/utils"
import {signer} from "src/engine/session/derived"

export async function requestZap(content, amount, {pubkey, relays, eid = null}) {
  const person = people.key(pubkey).get()

  if (!person?.zapper) {
    throw new Error("Can't zap a person without a zapper")
  }

  const {callback, lnurl} = person.zapper
  const msats = amount * 1000

  const tags = [
    ["relays", ...relays],
    ["amount", msats.toString()],
    ["lnurl", lnurl],
    ["p", pubkey],
  ]

  if (eid) {
    tags.push(["e", eid])
  }

  const zap = await signer.get().signAsUser(buildEvent(9734, {content, tags}))
  const zapString = encodeURI(JSON.stringify(zap))
  const res = await Fetch.fetchJson(`${callback}?amount=${msats}&nostr=${zapString}&lnurl=${lnurl}`)

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
