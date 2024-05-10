import type {TrustedEvent} from "@welshman/util"

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
