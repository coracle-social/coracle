import type {OwnedEvent, HashedEvent} from "@welshman/util"
import {makeEvent, own, getPubkey, makeSecret} from "@welshman/util"
import {synced, localStorageProvider, withGetter} from "@welshman/store"
import PowWorker from "src/workers/pow?worker"
import {isMobile} from "src/util/html"

export const benchmark = withGetter(
  synced({
    key: "benchmark",
    defaultValue: 0,
    storage: localStorageProvider,
  }),
)

export const benchmarkDifficulty = isMobile ? 14 : 16

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

let benchmarkStarted = false

export const startBenchmark = () => {
  if (benchmarkStarted || benchmark.get() > 0) return

  benchmarkStarted = true

  const secret = makeSecret()
  const pubkey = getPubkey(secret)
  const event = own(makeEvent(1, {}), pubkey)
  const pow = makePow(event, benchmarkDifficulty)
  const start = Date.now()

  pow.result.then(() => {
    benchmark.set(Date.now() - start)
  })
}

export const estimateWork = (difficulty: number) => {
  startBenchmark()

  return Math.ceil(benchmark.get() * Math.pow(2, difficulty - benchmarkDifficulty))
}
