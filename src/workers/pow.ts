import {getEventHash} from "nostr-tools"
import type {SignedEvent} from "@welshman/util"
import {} from "nostr-tools"

type In = {
  event: SignedEvent
  difficulty: number
}

export type PoWEvent = SignedEvent & {
  nonce: number
  hash: string
}

self.onmessage = (event: MessageEvent<In>) => {
  // Perform some computation
  const result = generatePoW(event.data.event, event.data.difficulty)
  self.postMessage(result)
}

export const generatePoW = (event: SignedEvent, difficulty: number) => {
  let nonce = 0
  let hash
  const target = "0".repeat(Math.ceil(difficulty / 4)) // Hex leading zero target
  // add the nonce tag to the event
  event.tags.push(["nonce", "0", difficulty.toString()])
  do {
    hash = getEventHash(event)
    nonce++
    event.tags[event.tags.length - 1][1] = nonce.toString()
  } while (!hash.startsWith(target))

  return {...event, id: hash}
}
