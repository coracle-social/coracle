import {prop} from "ramda"
import {Fetch, sleep} from "hurdak"
import {now, joinPath} from "src/util/misc"
import {Tags} from "src/util/nostr"
import {cached} from "src/util/lruCache"
import {nip98Fetch} from "src/engine/auth/commands"
import {generatePrivateKey} from "nostr-tools"
import {signer} from "src/engine/session/derived"
import {buildEvent} from "src/engine/network/utils"

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

  // return Tags.from(response.nip94_event).type("url").values().first()
  return response.nip94_event
}

export const createNIP94 = async (events) => {

  const tags = []
  for (const event of events) {
    tags.push(["url", Tags.from(event).type("url").values().first()])
  }

  // We add only the first m field, do you think that is necessary to control all of m fields are the same?
  tags.push(["m", Tags.from(events[0]).type("m").values().first()])

  // We add only the first x field, do you think that is necessary to control all of x fields are the same?
  tags.push(["x", Tags.from(events[0]).type("x").values().first()])

  // We add only the first ox field, do you think that is necessary to control all of ox fields are the same?
  tags.push(["ox", Tags.from(events[0]).type("ox").values().first()])

  console.debug("tags", tags)

  const template = buildEvent(1063, {tags})
  const $signer = signer.get()

  const event = $signer.canSign()
    ? await $signer.signAsUser(template)
    : await $signer.signWithKey(template, generatePrivateKey())

  return event
}


