import {now} from "paravel"
import {seconds} from "hurdak"
import {generatePrivateKey} from "src/util/nostr"
import {env} from "src/engine/session/state"
import {hints} from "src/engine/relays/utils"
import type {Event} from "src/engine/events/model"
import {createAndPublish} from "./publish"
import {subscribe} from "./subscribe"

export type DVMRequestOpts = {
  kind: number
  input: any
  inputOpts?: string[]
  tags?: string[][]
  relays?: string[]
  timeout?: number
  onProgress?: (e: Event) => void
}

export const dvmRequest = async ({
  kind,
  input,
  inputOpts = [],
  tags = [],
  timeout = 30_000,
  relays = null,
  onProgress = null,
}: DVMRequestOpts): Promise<Event> => {
  if (!relays) {
    relays = hints.Broadcast().getUrls(null, env.get().DVM_RELAYS)
  }

  if (typeof input !== "string") {
    input = JSON.stringify(input)
  }

  createAndPublish(kind, {
    relays,
    sk: generatePrivateKey(),
    tags: tags.concat([
      ["i", input, ...inputOpts],
      ["expiration", String(now() + seconds(1, "hour"))],
    ]),
  })

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
