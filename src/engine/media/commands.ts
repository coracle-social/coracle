import {Fetch} from "hurdak"
import {generatePrivateKey} from "nostr-tools"
import {signer} from "src/engine/session/derived"
import {buildEvent} from "src/engine/network/utils"

export const uploadToNostrBuild = async body => {
  const $signer = signer.get()
  const url = "https://nostr.build/api/v2/upload/files"
  const template = buildEvent(27235, {
    tags: [
      ["u", url],
      ["method", "POST"],
    ],
  })

  const event = await ($signer.canSign()
    ? $signer.prepAsUser(template)
    : $signer.prepWithKey(template, generatePrivateKey()))

  return Fetch.fetchJson(url, {
    body,
    method: "POST",
    headers: {
      Authorization: `Nostr ${btoa(JSON.stringify(event))}`,
    },
  })
}
