import {fetchJson, tryFunc, tryJson, hexToBech32, bech32ToHex} from "src/util/misc"
import {Table} from "src/agent/db"

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

export default ({sync, sortByGraph}) => {
  const zappers = new Table("nip57/zappers", "pubkey", {max: 5000, sort: sortByGraph})

  sync.addHandler(0, e => {
    tryJson(async () => {
      const kind0 = JSON.parse(e.content)
      const zapper = zappers.get(e.pubkey)
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

      zappers.patch({
        pubkey: e.pubkey,
        lnurl: hexToBech32("lnurl", url),
        callback: result.callback,
        minSendable: result.minSendable,
        maxSendable: result.maxSendable,
        nostrPubkey: result.nostrPubkey,
        created_at: e.created_at,
      })
    })
  })

  return {
    zappers,
  }
}
