import type {Event} from 'nostr-tools'

export type Relay = {
  url: string
}

export type Person = {
  pubkey: string
  picture?: string
  relays?: Array<Relay>
  muffle?: Array<Array<string>>
  petnames?: Array<Array<string>>
}


export type MyEvent = Event & {
  seen_on: string
}

export type DisplayEvent = MyEvent & {
  replies: []
  reactions: []
  children: []
}
