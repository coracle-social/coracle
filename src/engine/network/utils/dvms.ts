import {now} from "@coracle.social/lib"
import {seconds} from "hurdak"
import {env} from "src/engine/session/state"
import {hints} from "src/engine/relays/utils"
import type {Event} from "src/engine/events/model"
import {subscribe, createAndPublish} from "./executor"

export type DVMRequestOpts = {
  kind: number
  input: any
  inputOpts?: string[]
  tags?: string[][]
  relays?: string[]
  timeout?: number
  onProgress?: (e: Event) => void
  privateKey?: string
}

export const dvmRequest = async ({
  kind,
  input,
  inputOpts = [],
  tags = [],
  timeout = 30_000,
  relays = null,
  onProgress = null,
  privateKey = null,
}: DVMRequestOpts): Promise<Event> => {
  if (!relays) {
    relays = hints.merge([hints.WriteRelays(), hints.scenario([env.get().DVM_RELAYS])]).getUrls()
  }

  if (typeof input !== "string") {
    input = JSON.stringify(input)
  }

  createAndPublish({
    kind,
    relays,
    sk: privateKey,
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
      onComplete: () => {
        resolve(null)
      },
    })

    setTimeout(sub.close, timeout)
  })
}
