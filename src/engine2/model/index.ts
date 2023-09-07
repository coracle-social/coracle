import type {Event as NostrToolsEvent, UnsignedEvent} from "nostr-tools"

// Message types

export type Event = Omit<NostrToolsEvent, "kind"> & {
  kind: number
  seen_on: string[]
  wrap?: Event
}

export type Rumor = UnsignedEvent & {
  id: string
}

export type Filter = {
  ids?: string[]
  kinds?: number[]
  authors?: string[]
  since?: number
  until?: number
  limit?: number
  search?: string
  [key: `#${string}`]: string[]
}

export type DynamicFilter = Omit<Filter, "authors"> & {
  authors?: string[] | "follows" | "network" | "global"
}

// Domain types

export type KeyState = {
  method: string
  pubkey: string
  privkey?: string
  bunkerKey?: string
  bunkerToken?: string
}

export type ZapEvent = Event & {
  invoiceAmount: number
  request: Event
}

export type DisplayEvent = Event & {
  zaps: Event[]
  replies: DisplayEvent[]
  reactions: Event[]
  matchesFilter?: boolean
}

export type RelayInfo = {
  contact?: string
  description?: string
  last_checked?: number
  supported_nips?: number[]
  limitation?: {
    payment_required?: boolean
    auth_required?: boolean
  }
}

export type Relay = {
  url: string
  count?: number
  first_seen?: number
  info?: RelayInfo
}

export enum RelayMode {
  Read = "read",
  Write = "write",
}

export type RelayPolicy = {
  url: string
  read: boolean
  write: boolean
}

export type Profile = {
  name?: string
  nip05?: string
  lud16?: string
  about?: string
  banner?: string
  picture?: string
  display_name?: string
}

export type Handle = {
  profile: Record<string, any>
  pubkey: string
  address: string
}

export type Zapper = {
  pubkey: string
  lnurl: string
  callback: string
  minSendable: number
  maxSendable: number
  nostrPubkey: string
}

export type Person = {
  pubkey: string
  last_fetched?: number
  profile_updated_at?: number
  profile?: Profile
  petnames_updated_at?: number
  petnames?: string[][]
  mutes_updated_at?: number
  mutes?: string[][]
  relays_updated_at?: number
  relays: RelayPolicy[]
  handle_updated_at?: number
  handle: Handle
  zapper_updated_at?: number
  zapper: Handle
}

export type Channel = {
  id: string
  type: "nip28" | "nip04" | "nip44"
  relays: string[]
  messages: Event[]
  last_sent?: number
  last_received?: number
  last_checked?: number
  meta_updated_at?: number
  meta?: {
    name?: string
    about?: string
    picture?: string
  }
}

export type Topic = {
  name: string
  count?: number
}

export type List = {
  name: string
  naddr: string
  pubkey: string
  tags: string[][]
  updated_at: number
  created_at: number
  deleted_at?: number
}
