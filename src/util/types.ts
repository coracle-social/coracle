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
