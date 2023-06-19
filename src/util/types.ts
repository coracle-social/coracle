import type {Event} from "nostr-tools"

export type Relay = {
  url: string
  score?: number
  write?: boolean
  read?: boolean
}

export type Person = {
  pubkey: string
  petnames?: Array<Array<string>>
  relays?: Array<Relay>
  mutes?: Array<Array<string>>
  kind0?: {
    name?: string
    about?: string
    nip05?: string
    picture?: string
  }
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
