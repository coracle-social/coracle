import {Fetch} from "hurdak"
import {signer} from "src/engine2/queries"
import {buildEvent} from "./util"

export function uploadToNostrBuild(body) {
  const url = "https://nostr.build/api/v2/upload/files"
  const event = signer.get().prepAsUser(
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
