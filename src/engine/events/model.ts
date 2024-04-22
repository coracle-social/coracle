import type {Event as NostrToolsEvent} from "nostr-tools"
import type {Publish} from "@welshman/net"

export type NostrEvent = NostrToolsEvent

export type Event = NostrEvent & {
  wrap?: Event
}

export type ReadReceipt = {
  id: string
  published?: number
}

export type PublishInfo = Omit<Publish, "emitter" | "result">
