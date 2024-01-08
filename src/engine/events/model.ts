import type {Event as NostrToolsEvent, UnsignedEvent} from "nostr-tools"

export type NostrEvent = NostrToolsEvent

export type Event = Omit<NostrToolsEvent, "kind"> & {
  kind: number
  seen_on: string[]
  wrap?: Event
}

export type Rumor = UnsignedEvent & {
  id: string
}
