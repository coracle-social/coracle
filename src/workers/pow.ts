import {createSHA256} from "hash-wasm"
import {bytesToHex} from "@noble/curves/abstract/utils"

self.onmessage = async function (ev: MessageEvent) {
  const {event, difficulty, start = 0, step = 1} = ev.data

  let count = start

  const tag = ["nonce", count.toString(), difficulty.toString()]

  event.tags.push(tag)

  const hasher = await createSHA256()

  while (true) {
    count += step
    tag[1] = count.toString()

    hasher.init()
    hasher.update(
      JSON.stringify([0, event.pubkey, event.created_at, event.kind, event.tags, event.content]),
    )

    const id = hasher.digest("binary")
    const pow = getPow(id)

    if (pow >= difficulty) {
      event.id = bytesToHex(id)
      break
    }
  }

  postMessage(event)
}

function getPow(id: Uint8Array): number {
  let count = 0

  for (let i = 0; i < 32; i++) {
    const nibble = id[i]
    if (nibble === 0) {
      count += 8
    } else {
      count += Math.clz32(nibble) - 24
      break
    }
  }

  return count
}
