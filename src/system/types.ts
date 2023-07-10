import type {Event as NostrToolsEvent} from "nostr-tools"

export type Event = NostrToolsEvent & {
  seen_on: string[]
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

export type UserSettings = {
  last_updated: number
  relay_limit: number
  default_zap: number
  show_media: boolean
  report_analytics: boolean
  dufflepud_url: string
  multiplextr_url: string
}

export type KeyState = {
  method?: string
  pubkey?: string
  privkey?: string
  bunkerKey?: string
}
