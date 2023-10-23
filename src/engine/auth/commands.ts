import crypto from "crypto"
import {Fetch} from "hurdak"
import {generatePrivateKey} from "nostr-tools"
import {signer} from "src/engine/session/derived"
import {buildEvent} from "src/engine/network/utils"

export const nip98Fetch = async (url, method, body = null) => {
  const tags = [
    ["u", url],
    ["method", method],
  ]

  if (body) {
    tags.push(["payload", crypto.createHash("sha256").update(JSON.stringify(body)).digest("hex")])
  }

  const template = buildEvent(27235, {tags})
  const $signer = signer.get()

  const event = $signer.canSign()
    ? await $signer.signAsUser(template)
    : await $signer.signWithKey(template, generatePrivateKey())

  const auth = btoa(JSON.stringify(event))
  const headers = {Authorization: `Nostr ${auth}`}

  return Fetch.fetchJson(url, {body, method, headers})
}
