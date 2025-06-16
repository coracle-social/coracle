import type {OwnedEvent, HashedEvent} from "@welshman/util"
import {makeEvent, getTag} from "@welshman/util"
import {makeSecret, own, getPubkey} from "@welshman/signer"
import {synced, withGetter} from "@welshman/store"
import PowWorker from "src/workers/pow?worker"
import {isMobile} from "src/util/html"

export const benchmark = withGetter(synced("benchmark", 0))

export const benchmarkDifficulty = isMobile ? 14 : 16

export const estimateWork = (difficulty: number) =>
  Math.ceil(benchmark.get() * Math.pow(2, difficulty - benchmarkDifficulty))

export type ProofOfWork = {
  worker: Worker
  result: Promise<HashedEvent>
}

export const makePow = (event: OwnedEvent, difficulty: number): ProofOfWork => {
  const worker = new PowWorker()

  const result = new Promise<HashedEvent>((resolve, reject) => {
    worker.onmessage = (e: MessageEvent<HashedEvent>) => {
      resolve(e.data)
      worker.terminate()
    }

    worker.onerror = e => {
      reject(e)
      worker.terminate()
    }

    worker.postMessage({difficulty, event})
  })

  return {worker, result}
}

export const getPow = (event: HashedEvent): number => {
  const difficulty = parseInt(getTag("nonce", event.tags)?.[2])

  if (isNaN(difficulty)) return 0

  let count = 0

  // Convert hex string to array of bytes
  for (let i = 0; i < event.id.length; i += 2) {
    const byte = parseInt(event.id.slice(i, i + 2), 16)
    if (byte === 0) {
      count += 8
    } else {
      count += Math.clz32(byte) - 24
      break
    }
  }

  return count >= difficulty ? difficulty : 0
}

// Generate a simple pow to estimate the device capacities
if (benchmark.get() === 0) {
  const secret = makeSecret()
  const pubkey = getPubkey(secret)
  const event = own(makeEvent(1, {}), pubkey)
  const pow = makePow(event, benchmarkDifficulty)
  const start = Date.now()

  pow.result.then(() => {
    benchmark.set(Date.now() - start)
  })
}
