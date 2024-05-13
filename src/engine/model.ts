import type {Publish} from "@welshman/net"
import type {SignedEvent, TrustedEvent, Zapper} from "@welshman/util"

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
  faults?: number[]
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
export type NostrConnectHandler = {
  pubkey?: string
  domain?: string
  relays?: string[]
}

export enum GroupAccess {
  None = null,
  Requested = "requested",
  Granted = "granted",
  Revoked = "revoked",
}

export type GroupMeta = {
  name?: string
  about?: string
  banner?: string
  picture?: string
}

export type Group = {
  id: string
  pubkey: string
  address: string
  meta?: GroupMeta
  meta_updated_at?: number
  feeds?: string[][]
  feeds_updated_at?: number
  relays?: string[]
  relays_updated_at?: number
  members?: string[]
  recent_member_updates?: TrustedEvent[]
  listing_is_public?: boolean
  listing_is_public_updated?: boolean
}

export type GroupKey = {
  group: string
  pubkey: string
  privkey: string
  created_at: number
  hints?: string[]
}

export type GroupRequest = TrustedEvent & {
  group: string
  resolved: boolean
}

export type GroupAlert = TrustedEvent & {
  group: string
  type: "exit" | "invite"
}

export type DisplayEvent = TrustedEvent & {
  replies?: DisplayEvent[]
  reposts?: TrustedEvent[]
}

export type Profile = {
  name?: string
  nip05?: string
  lud06?: string
  lud16?: string
  about?: string
  banner?: string
  picture?: string
  website?: string
  display_name?: string
}

export type Handle = {
  profile: Record<string, any>
  pubkey: string
  address: string
}

export type Person = {
  pubkey: string
  profile_fetched_at?: number
  profile_updated_at?: number
  profile?: Profile
  petnames_updated_at?: number
  petnames?: string[][]
  mutes_updated_at?: number
  mutes?: string[][]
  relays_fetched_at?: number
  relays_updated_at?: number
  relays?: RelayPolicy[]
  communities_updated_at?: number
  communities?: string[][]
  handle_updated_at?: number
  handle?: Handle
  zapper_updated_at?: number
  zapper?: Zapper
}

export type ReadReceipt = {
  id: string
  published?: number
}

export type PublishInfo = Omit<Publish, "emitter" | "result">

export type Handler = {
  address: string
  event: TrustedEvent
}

export type HandlerRec = {
  address: string
  event: TrustedEvent
}

export type Notification = {
  key: string
  event: TrustedEvent
  timestamp: number
  interactions: TrustedEvent[]
}

export enum OnboardingTask {
  BackupKey = "backup_key",
  SetupWallet = "setup_wallet",
}
export type Topic = {
  name: string
  count?: number
  last_seen?: number
}

export type Channel = {
  id: string
  relays: string[]
  members: string[]
  messages: TrustedEvent[]
  last_sent?: number
  last_received?: number
  last_checked?: number
}

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
  kind0?: SignedEvent
  kind0_updated?: string
  kind3?: SignedEvent
  kind3_updated?: string
  kind10002?: SignedEvent
  kind10002_updated?: string
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
