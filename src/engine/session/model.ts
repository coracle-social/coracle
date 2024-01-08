import type {GroupAccess} from "src/engine/groups/model"

export type GroupStatus = {
  joined: GroupAccess
  joined_updated_at: number
  access: GroupAccess
  access_updated_at: number
  last_synced: number
}

export type Session = {
  method: string
  pubkey: string
  privkey?: string
  bunkerKey?: string
  bunkerToken?: string
  bunkerRelay?: string
  settings?: Record<string, any>
  settings_updated_at?: number
  groups_last_synced?: number
  notifications_last_synced?: number
  nip24_messages_last_synced?: number
  groups?: Record<string, GroupStatus>
}
