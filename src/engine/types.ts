import type {Event as NostrToolsEvent} from "nostr-tools"

export type Event = NostrToolsEvent & {
  seen_on: string[]
}

export type DisplayEvent = Event & {
  replies: Event[]
  reactions: Event[]
  zaps: Event[]
}

export type DynamicFilter = Record<string, any>

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

export type Zapper = {
  pubkey: string
  lnurl: string
  callback: string
  minSendable: number
  maxSendable: number
  nostrPubkey: string
  created_at: number
  updated_at: number
}

export type Handle = {
  profile: Record<string, any>
  pubkey: string
  address: string
  created_at: number
  updated_at: number
}

export type RelayInfo = {
  contact?: string
  description?: string
  last_checked?: number
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

export type RelayPolicy = {
  pubkey: string
  created_at: number
  updated_at: number
  relays: {url: string; read: boolean; write: boolean}[]
}

export type RelayStat = {
  url: string
  error?: string
  last_opened?: number
  last_activity?: number
  last_publish?: number
  last_sub?: number
  total_subs?: number
  active_subs?: number
  events_count?: number
  eose_count?: number
  eose_timer?: number
  timeouts?: number
}

export type GraphEntry = {
  pubkey: string
  updated_at: number
  petnames_updated_at?: number
  petnames?: string[][]
  mutes_updated_at?: number
  mutes?: string[][]
}

export type Profile = {
  pubkey: string
  created_at?: number
  updated_at?: number
  name?: string
  nip05?: string
  lud16?: string
  about?: string
  banner?: string
  picture?: string
  display_name?: string
}

export type Channel = {
  id: string
  type: "public" | "private"
  pubkey: string
  updated_at: number
  last_sent?: number
  last_received?: number
  last_checked?: number
  joined?: boolean
  hints: string[]
}

export type Message = {
  id: string
  channel: string
  pubkey: string
  created_at: number
  content: string
  tags: string[][]
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
