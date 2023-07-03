import type {Event} from "nostr-tools"

export type Relay = {
  url: string
  score?: number
  write?: boolean
  read?: boolean
}

export type MyEvent = Event & {
  seen_on: string[]
}

export type DisplayEvent = MyEvent & {
  replies: Array<MyEvent>
  reactions: Array<MyEvent>
  zaps: Array<MyEvent>
}

export type Room = {
  id: string
  pubkey: string
  name?: string
  about?: string
  picture?: string
}

export type DynamicFilter = Record<string, any>
