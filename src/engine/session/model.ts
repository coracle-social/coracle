import type {Event} from "src/engine/events/model"
import type {GroupAccess} from "src/engine/groups/model"
import type {NostrConnectHandler} from "src/engine/network/model"

export type GroupStatus = {
  joined: boolean
  joined_updated_at: number
  access: GroupAccess
  access_updated_at: number
  last_synced: number
}

export type Session = {
  method: string
  pubkey: string
  privkey?: string
  connectKey?: string
  connectToken?: string
  connectHandler?: NostrConnectHandler
  kind3?: Event
  kind3_updated?: string
  settings?: Record<string, any>
  settings_updated_at?: number
  seen_last_synced?: number
  groups_last_synced?: number
  deletes_last_synced?: number
  notifications_last_synced?: number
  nip24_messages_last_synced?: number
  nip59_messages_last_synced?: number
  groups?: Record<string, GroupStatus>
  onboarding_tasks_completed?: string[]
}

export type Env = {
  CLIENT_ID: string
  CLIENT_NAME: string
  DEFAULT_FOLLOWS: string[]
  DEFAULT_RELAYS: string[]
  DUFFLEPUD_URL: string
  DVM_RELAYS: string[]
  ENABLE_MARKET: boolean
  ENABLE_ZAPS: boolean
  FORCE_GROUP: string
  IMGPROXY_URL: string
  MULTIPLEXTR_URL: string
  NIP96_URLS: string[]
  ONBOARDING_LISTS: string[]
  PLATFORM_PUBKEY: string
  PLATFORM_RELAYS: string[]
  PLATFORM_ZAP_SPLIT: number
  SEARCH_RELAYS: string[]
}
