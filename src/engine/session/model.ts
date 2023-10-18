export type GroupStatus = {
  joined: boolean
  joined_updated_at: number
  access: "requested" | "granted" | "revoked"
  access_updated_at: number
}

export type Session = {
  method: string
  pubkey: string
  privkey?: string
  bunkerKey?: string
  bunkerToken?: string
  settings?: Record<string, any>
  settings_updated_at?: number
  notifications_last_synced?: number
  nip04_messages_last_synced?: number
  nip24_messages_last_synced?: number
  groups?: Record<string, GroupStatus>
}
