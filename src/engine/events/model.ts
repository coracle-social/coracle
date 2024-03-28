import type {Event as NostrToolsEvent} from "nostr-tools"

export type NostrEvent = NostrToolsEvent

export type Event = NostrEvent & {
  wrap?: Event
}

export type ReadReceipt = {
  id: string
  published?: number
}
