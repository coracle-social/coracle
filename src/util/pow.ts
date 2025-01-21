import type {SignedEvent} from "@welshman/util"
import type {PoWEvent} from "src/workers/pow"
import PowWorker from "src/workers/pow?worker"
import {warn} from "./logger"

export const powEvent = async (event: SignedEvent, pow_difficulty: number) => {
  const worker = new PowWorker()
  const powPromise = new Promise<PoWEvent>((resolve, reject) => {
    worker.onmessage = (e: MessageEvent<PoWEvent>) => {
      resolve(e.data)
    }
    worker.onerror = e => {
      reject(e)
    }
  })
  worker.postMessage({difficulty: pow_difficulty, event})
  try {
    event = await powPromise
  } catch (error) {
    warn(error)
  }
  return event
}
