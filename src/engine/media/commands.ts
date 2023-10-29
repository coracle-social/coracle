import {prop} from "ramda"
import {Fetch, sleep} from "hurdak"
import {now, joinPath} from "src/util/misc"
import {Tags} from "src/util/nostr"
import {cached} from "src/util/lruCache"
import {nip98Fetch} from "src/engine/auth/commands"

export const getMediaProviderURL = cached({
  maxSize: 10,
  getKey: ([url]) => url,
  getValue: ([url]) => fetchMediaProviderURL(url),
})

const fetchMediaProviderURL = async host =>
  prop("api_url", await Fetch.fetchJson(joinPath(host, ".well-known/nostr/nip96.json")))

export const uploadToMediaProvider =  async (url, body) => {
  const startTime = now()
  const apiUrl = await getMediaProviderURL(url)
  const response = await nip98Fetch(apiUrl, "POST", body)

  // If the media provider uses delayed processing, we need to wait for the processing to be done
  while (response.processing_url) {
    const {status, nip94_event} = await nip98Fetch(response.processing_url, "GET")

    if (status === "success") {
      return Tags.from(nip94_event).type("url").values().first()
    }

    if (now() - startTime > 60) {
      break
    }

    await sleep(3000)
  }

  return Tags.from(response.nip94_event).type("url").values().first()
}
