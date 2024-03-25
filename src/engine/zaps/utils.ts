import {cached, bech32ToHex} from "@coracle.social/lib"
import type {Zapper} from "@coracle.social/util"
import {pick, uniq} from "ramda"
import {Fetch, tryFunc, sleep, createMapOf} from "hurdak"
import {createBatcher} from "src/util/misc"
import {people} from "src/engine/people/state"
import {dufflepud} from "src/engine/session/utils"

export const fetchZapper = createBatcher(3000, async (lnurls: string[]) => {
  const data =
    (await tryFunc(async () => {
      // Dufflepud expects plaintext but we store lnurls encoded
      const res = await Fetch.postJson(dufflepud("zapper/info"), {
        lnurls: uniq(lnurls).map(bech32ToHex),
      })

      return res?.data
    })) || []

  const infoByLnurl = createMapOf("lnurl", "info", data)

  return lnurls.map(lnurl => {
    const zapper = tryFunc(() => infoByLnurl[bech32ToHex(lnurl)])

    if (!zapper) {
      return null
    }

    return {
      ...pick(["callback", "minSendable", "maxSendable", "nostrPubkey", "allowsNostr"], zapper),
      lnurl,
    } as Zapper
  })
})

export const getZapper = cached({
  maxSize: 100,
  getKey: ([lnurl]) => lnurl,
  getValue: ([lnurl]) => fetchZapper(lnurl),
})

export const getZapperForPubkey = async (pubkey, lnurl = null) => {
  const zapper = people.key(pubkey).get()?.zapper

  // Allow the caller to specify a lnurl override, but don't fetch
  // if we already know it
  return zapper?.lnurl === lnurl ? zapper : await getZapper(lnurl)
}

export const getLightningImplementation = async () => {
  const {webln} = window as {webln?: any}

  if (webln) {
    return "webln"
  }

  const [bc] = await Promise.all([import("@getalby/bitcoin-connect"), sleep(300)])

  if (bc?.isConnected()) {
    return "bc"
  }

  return null
}
