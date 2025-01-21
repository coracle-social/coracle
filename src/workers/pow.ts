import crypto from "crypto"
import type {SignedEvent} from "@welshman/util"

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

// Convert event to JSON and hash with SHA-256
function hashEvent(event, nonce) {
  const eventWithNonce = {...event, nonce} // Add nonce to the event
  const eventString = JSON.stringify(eventWithNonce)
  return crypto.createHash("sha256").update(eventString).digest("hex")
}

export const generatePoW = (event: SignedEvent, difficulty: number) => {
  let nonce = 0
  let hash
  const target = "0".repeat(Math.ceil(difficulty / 4)) // Hex leading zero target

  do {
    hash = hashEvent(event, nonce)
    nonce++
  } while (!hash.startsWith(target))

  return {...event, nonce, hash}
}
