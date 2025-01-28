import type {OwnedEvent} from "@welshman/util"
import {warn} from "./logger"

export const addPoWStamp = async (worker: Worker, event: OwnedEvent, pow_difficulty: number) => {
  const powPromise = new Promise<OwnedEvent>((resolve, reject) => {
    worker.onmessage = (e: MessageEvent<OwnedEvent>) => {
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
