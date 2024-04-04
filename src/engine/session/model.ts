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
  kind0?: Event
  kind0_updated?: string
  kind3?: Event
  kind3_updated?: string
  kind10002?: Event
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
