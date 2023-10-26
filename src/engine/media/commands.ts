import {Fetch} from "hurdak"
import {createEvent} from "paravel"
import {generatePrivateKey} from "nostr-tools"
import {signer} from "src/engine/session/derived"

export const uploadToNostrBuild = async body => {
  const $signer = signer.get()
  const url = "https://nostr.build/api/v2/upload/files"
  const template = createEvent(27235, {
    tags: [
      ["u", url],
      ["method", "POST"],
    ],
  })

  const event = await ($signer.canSign()
    ? $signer.signAsUser(template)
    : $signer.signWithKey(template, generatePrivateKey()))

  return Fetch.fetchJson(url, {
    body,
    method: "POST",
    headers: {
      Authorization: `Nostr ${btoa(JSON.stringify(event))}`,
    },
  })
}
