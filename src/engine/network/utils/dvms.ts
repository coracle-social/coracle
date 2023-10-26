import {now} from "src/util/misc"
import {getUserRelayUrls} from "src/engine/relays/utils"
import type {Event} from "src/engine/events/model"
import {publishEvent} from "./publish"
import {subscribe} from "./subscribe"

export type DVMRequestOpts = {
  requestKind: number
  input: any
  tags?: string[][]
  relays?: string[]
  timeout?: number
  onProgress?: (e: Event) => void
}

export const dvmRequest = async ({
  kind,
  input,
  tags = [],
  timeout = 30_000,
  relays = null,
  onProgress = null,
}: DVMRequestOpts) => {
  if (!relays) {
    relays = getUserRelayUrls()
  }

  if (typeof input !== "string") {
    input = JSON.stringify(input)
  }

  publishEvent(kind, {relays, tags: [["i", input], ...tags]})

  return new Promise(resolve => {
    const kinds = [kind + 1000]

    if (onProgress) {
      kinds.push(7000)
    }

    const sub = subscribe({
      relays,
      filters: [{kinds, since: now()}],
      onEvent: (e: Event) => {
        if (e.kind === 7000) {
          onProgress?.(e)
        } else {
          resolve(e)
          sub.close()
        }
      },
      onClose: () => {
        resolve(null)
      },
    })

    setTimeout(sub.close, timeout)
  })
}
