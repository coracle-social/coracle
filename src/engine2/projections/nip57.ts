import {Fetch, tryFunc} from "hurdak"
import {tryJson, hexToBech32, bech32ToHex} from "src/util/misc"
import {people} from "src/engine2/state"
import {dufflepud} from "src/engine2/queries"
import {projections, updateKey} from "src/engine2/projections/core"

projections.addHandler(0, e => {
  tryJson(async () => {
    const {
      kind0: {lud16, lud06},
    } = JSON.parse(e.content)
    const address = (lud16 || lud06 || "").toLowerCase()

    if (!address) {
      return
    }

    const lnurl = getLnUrl(address)

    if (!lnurl) {
      return
    }

    const result = await tryFunc(() => Fetch.postJson(dufflepud("zapper/info"), {lnurl}))

    if (!result?.allowsNostr || !result?.nostrPubkey) {
      return
    }

    updateKey(people.key(e.pubkey), e.created_at, {
      zapper: {
        lnurl: hexToBech32("lnurl", lnurl),
        callback: result.callback,
        minSendable: result.minSendable,
        maxSendable: result.maxSendable,
        nostrPubkey: result.nostrPubkey,
      },
    })
  })
})

function getLnUrl(address: string): string {
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
