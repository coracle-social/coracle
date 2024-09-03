import type {Publish} from "@welshman/net"
import type {TrustedEvent, Zapper as WelshmanZapper} from "@welshman/util"
import type {Session} from "@welshman/app"
import {isTrustedEvent} from "@welshman/util"

export enum GroupAccess {
  None = null,
  Requested = "requested",
  Granted = "granted",
  Revoked = "revoked",
}

export type Group = {
  id: string
  pubkey: string
  address: string
  members?: string[]
  recent_member_updates?: TrustedEvent[]
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

export const isGroupRequest = (e: any): e is GroupRequest =>
  typeof e.group === "string" && typeof e.resolved === "boolean" && isTrustedEvent(e)

export type GroupAlert = TrustedEvent & {
  group: string
  type: "exit" | "invite"
}

export const isGroupAlert = (e: any): e is GroupAlert =>
  typeof e.group === "string" && typeof e.type === "string" && isTrustedEvent(e)

export type DisplayEvent = TrustedEvent & {
  replies?: DisplayEvent[]
  reposts?: TrustedEvent[]
}

export type Zapper = WelshmanZapper & {
  lnurl: string
  pubkey: string
}

export type PublishInfo = Omit<Publish, "emitter" | "result">

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
  last_sent?: number
  last_received?: number
  last_checked?: number
  messages: TrustedEvent[]
}

export type GroupStatus = {
  joined: boolean
  joined_updated_at: number
  access: GroupAccess
  access_updated_at: number
  last_synced: number
}

export type SessionWithMeta = Session & {
  groups_last_synced?: number
  notifications_last_synced?: number
  groups?: Record<string, GroupStatus>
  onboarding_tasks_completed?: string[]
}

export type AnonymousUserState = {
  follows: string[][]
  relays: string[][]
}
