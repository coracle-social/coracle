import {batch, postJson} from "@welshman/lib"
import {normalizeRelayUrl} from "@welshman/util"
import {DUFFLEPUD_URL} from "@app/base"
import {relayInfo} from "@app/state"

export const loadRelay = batch(1000, async (urls: string[]) => {
  const data = await postJson(`${DUFFLEPUD_URL}/relay/info`, {urls})

  relayInfo.update($relayInfo => {
    for (const {url, info} of data) {
      $relayInfo.set(normalizeRelayUrl(url), info)
    }

    return $relayInfo
  })
})
