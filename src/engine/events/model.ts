import type {Publish} from "@welshman/net"

export type ReadReceipt = {
  id: string
  published?: number
}

export type PublishInfo = Omit<Publish, "emitter" | "result">
