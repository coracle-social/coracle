import type {Event} from "src/engine/events/model"

export enum GroupAccess {
  Open = "open",
  Closed = "closed",
  Hybrid = "hybrid",
}

export enum MemberAccess {
  None = null,
  Requested = "requested",
  Granted = "granted",
  Revoked = "revoked",
}

export enum MembershipLevel {
  None = null,
  Public = "public",
  Private = "private",
}

export type Group = {
  id: string
  pubkey: string
  address: string
  updated_at?: number
  relays?: string[]
  name?: string
  image?: string
  description?: string
  moderators?: string[]
  access?: GroupAccess
}

export type GroupKey = {
  group: string
  pubkey: string
  privkey: string
  created_at: number
  members: string[]
  hints?: string[]
}

export type GroupRequest = Event & {
  group: string
  resolved: boolean
}

export type GroupAlert = Event & {
  group: string
  type: "exit" | "invite"
}
