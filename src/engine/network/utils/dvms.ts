import {now} from "@welshman/lib"
import type {Publish} from "@welshman/net"
import type {TrustedEvent} from "@welshman/util"
import {seconds} from "hurdak"
import {env} from "src/engine/session/state"
import {hints} from "src/engine/relays/utils"
import {subscribe, createAndPublish} from "./executor"

export type DVMRequestOpts = {
  kind: number
  input?: any
  inputOpts?: string[]
  tags?: string[][]
  relays?: string[]
  timeout?: number
  onPublish?: (pub: Publish) => void
  onProgress?: (e: TrustedEvent) => void
  sk?: string
}

export const dvmRequest = async ({
  kind,
  input = "",
  inputOpts = [],
  tags = [],
  timeout = 30_000,
  relays = [],
  onPublish = null,
  onProgress = null,
  sk = null,
}: DVMRequestOpts): Promise<TrustedEvent> => {
  if (relays.length === 0) {
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
      onEvent: (e: TrustedEvent) => {
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
