import {Fetch} from "hurdak"
import {signer} from "src/engine/session/derived"
import {buildEvent} from "src/engine/network/utils"

export const uploadToNostrBuild = async body => {
  const url = "https://nostr.build/api/v2/upload/files"
  const event = await signer.get().prepAsUser(
    buildEvent(27235, {
      tags: [
        ["u", url],
        ["method", "POST"],
      ],
    })
  )

  return Fetch.fetchJson(url, {
    body,
    method: "POST",
    headers: {
      Authorization: `Nostr ${btoa(JSON.stringify(event))}`,
    },
  })
}
