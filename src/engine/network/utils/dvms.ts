import {now} from "@coracle.social/lib"
import type {Publish} from "@coracle.social/network"
import {seconds} from "hurdak"
import {env} from "src/engine/session/state"
import {hints} from "src/engine/relays/utils"
import type {Event} from "src/engine/events/model"
import {subscribe, createAndPublish} from "./executor"

export type DVMRequestOpts = {
  kind: number
  input?: any
  inputOpts?: string[]
  tags?: string[][]
  relays?: string[]
  timeout?: number
  onPublish?: (pub: Publish) => void
  onProgress?: (e: Event) => void
  sk?: string
}

export const dvmRequest = async ({
  kind,
  input = "",
  inputOpts = [],
  tags = [],
  timeout = 30_000,
  relays = null,
  onPublish = null,
  onProgress = null,
  sk = null,
}: DVMRequestOpts): Promise<Event> => {
  if (!relays) {
    relays = hints.merge([hints.WriteRelays(), hints.fromRelays(env.get().DVM_RELAYS)]).getUrls()
  }

  if (typeof input !== "string") {
    input = JSON.stringify(input)
  }

  tags = tags.concat([
    ["i", input, ...inputOpts],
    ["expiration", String(now() + seconds(1, "hour"))],
  ])

  const pub = await createAndPublish({kind, relays, sk, tags})

  onPublish?.(pub)

  return new Promise(resolve => {
    const kinds = [kind + 1000]

    if (onProgress) {
      kinds.push(7000)
    }

    const sub = subscribe({
      relays,
      filters: [
        {
          kinds,
          since: now() - seconds(1, "minute"),
          "#e": [pub.request.event.id],
        },
      ],
      onEvent: (e: Event) => {
        if (e.kind === 7000) {
          onProgress?.(e)
        } else {
          resolve(e)
          sub.close()
        }
      },
      onComplete: () => {
        resolve(null)
      },
    })

    setTimeout(sub.close, timeout)
  })
}
